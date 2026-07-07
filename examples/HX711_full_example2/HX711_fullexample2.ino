/*
 * ESP32 + HX711 Load Cell — Stable Filter + Reliable Calibration
 *
 * Key fixes:
 *   1. Median flush now requires 2 consecutive big readings before flushing
 *      → single noisy spike no longer poisons the buffer
 *   2. Calibration takes 50 samples and averages them
 *      → much more stable factor every time
 *   3. Calibration saves to flash automatically
 *
 * Serial commands:
 *   t  — tare
 *   r  — raw ADC value
 *   c  — calibrate (saves automatically)
 *   +  — nudge factor up (saves automatically)
 *   -  — nudge factor down (saves automatically)
 *   x  — clear saved calibration
 *   s  — show current settings
 */

#include <Arduino.h>
#include "HX711.h"
#include "soc/rtc.h"
#include <Preferences.h>
#include <WiFi.h>
#include "../../backend_api/BackendApi.h"

// ── Pin wiring ────────────────────────────────────────────────
const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN  = 22;

// ── WiFi / backend settings ───────────────────────────────────
const char* WIFI_SSID     = "10";
const char* WIFI_PASSWORD = "12345678";

BackendApi::Config backendConfig;

// ── General settings ──────────────────────────────────────────
const int   TARE_SAMPLES             = 30;
const int   READ_SAMPLES             = 10;   // reduced: faster loop, less blocking
const int   CAL_SAMPLES              = 50;   // more samples for calibration = stable factor
const float ZERO_BAND_G              = 3.0f;
const int   ZERO_RESET_COUNT         = 3;
const float STABLE_THRESHOLD_G       = 2.0f;
const int   STABLE_COUNT             = 5;
const int   MEDIAN_SIZE              = 7;    // reduced from 11 → faster response

// ── Dynamic LPF ───────────────────────────────────────────────
const float LPF_ALPHA_FAST           = 0.8f;
const float LPF_ALPHA_SLOW           = 0.2f;
const float LPF_CHANGE_THRESHOLD_G   = 20.0f;

// ── Confirmed flush settings ──────────────────────────────────
//
//  A flush only happens when FLUSH_CONFIRM_COUNT consecutive
//  readings all differ from current output by more than
//  FLUSH_THRESHOLD_G. This prevents one noisy spike from
//  poisoning the entire median buffer.
//
const float FLUSH_THRESHOLD_G        = 40.0f;  // how big a jump to consider flushing
const int   FLUSH_CONFIRM_COUNT      = 2;       // how many in a row needed to confirm

// ── Default calibration ───────────────────────────────────────
const float DEFAULT_CAL_FACTOR       = 104.6927f;

// ─────────────────────────────────────────────────────────────
HX711       scale;
Preferences prefs;

float calibrationFactor = DEFAULT_CAL_FACTOR;

// Median filter state
static float rawbuf[MEDIAN_SIZE] = {0};
static int   rawidx              = 0;
static int   rawcount            = 0;

// LPF state
static float lpf_output          = -1.0f;

// Zero snap state
static int   zero_confirm_count   = 0;

// Confirmed flush state
// Counts how many consecutive readings have been "big jump" so far
static int   flush_confirm_count = 0;
static float flush_pending_value = 0.0f;  // the value we're about to flush to

// ────────────────────────────────────────────────────────────
//  Flash save / load
// ────────────────────────────────────────────────────────────
void saveCalibration(float factor) {
  prefs.begin("loadcell", false);
  prefs.putFloat("cal_factor", factor);
  prefs.end();
  Serial.println("  [SAVED] factor = " + String(factor, 4));
}

float loadCalibration() {
  prefs.begin("loadcell", true);
  float saved = prefs.getFloat("cal_factor", DEFAULT_CAL_FACTOR);
  prefs.end();
  return saved;
}

void clearCalibration() {
  prefs.begin("loadcell", false);
  prefs.clear();
  prefs.end();
  calibrationFactor = DEFAULT_CAL_FACTOR;
  scale.set_scale(calibrationFactor);
  Serial.println("  [CLEARED] Reset to default: " + String(DEFAULT_CAL_FACTOR, 4));
}

// ────────────────────────────────────────────────────────────
//  Reset filters to a known value
// ────────────────────────────────────────────────────────────
void resetFilters(float startValue) {
  for (int i = 0; i < MEDIAN_SIZE; ++i) rawbuf[i] = startValue;
  rawcount            = MEDIAN_SIZE;
  rawidx              = 0;
  lpf_output          = startValue;
  flush_confirm_count = 0;
  flush_pending_value = startValue;
  zero_confirm_count   = 0;
}

// ────────────────────────────────────────────────────────────
//  Median filter with CONFIRMED flush
//
//  How it works:
//    The median buffer is updated first, then we check whether the
//    median itself has moved more than FLUSH_THRESHOLD_G away from the
//    current LPF output.
//    If that shift persists for FLUSH_CONFIRM_COUNT samples → flush.
//
//  This prevents a couple of bad raw samples from becoming the new
//  baseline, because a transient spike usually does not move the median.
// ────────────────────────────────────────────────────────────
float applyMedianFilter(float sample) {
  // Normal median update
  if (rawcount == 0) {
    for (int i = 0; i < MEDIAN_SIZE; ++i) rawbuf[i] = sample;
    rawcount = MEDIAN_SIZE;
    rawidx   = 0;
  } else {
    rawbuf[rawidx] = sample;
    rawidx = (rawidx + 1) % MEDIAN_SIZE;
    if (rawcount < MEDIAN_SIZE) rawcount++;
  }

  // Sort copy and return median
  float tmp[MEDIAN_SIZE];
  for (int i = 0; i < rawcount; ++i) tmp[i] = rawbuf[i];
  for (int i = 0; i < rawcount - 1; ++i) {
    int minj = i;
    for (int j = i + 1; j < rawcount; ++j) {
      if (tmp[j] < tmp[minj]) minj = j;
    }
    if (minj != i) { float t = tmp[i]; tmp[i] = tmp[minj]; tmp[minj] = t; }
  }
  int mid = rawcount / 2;
  float median_output = (rawcount % 2 == 1) ? tmp[mid] : (tmp[mid-1] + tmp[mid]) / 2.0f;

  float reference = (lpf_output >= 0.0f) ? lpf_output : 0.0f;
  float diff      = fabsf(median_output - reference);

  if (diff > FLUSH_THRESHOLD_G) {
    flush_confirm_count++;
    flush_pending_value = median_output;

    if (flush_confirm_count >= FLUSH_CONFIRM_COUNT) {
      // Confirmed! The median has moved, so this is a real change.
      Serial.println("  [FLUSH] confirmed jump to ~" + String(flush_pending_value, 1) + "g");
      resetFilters(flush_pending_value);
      return flush_pending_value;
    }

    // Not confirmed yet — keep the last known good value.
    return (lpf_output >= 0.0f) ? lpf_output : median_output;
  }

  // Small change — reset flush counter (streak broken)
  flush_confirm_count = 0;
  return median_output;
}

// ────────────────────────────────────────────────────────────
//  Dynamic LPF
// ────────────────────────────────────────────────────────────
float applyDynamicLPF(float median_output, float raw_sample) {
  if (lpf_output < 0.0f) {
    lpf_output = median_output;
    return lpf_output;
  }
  float change = fabsf(raw_sample - lpf_output);
  float alpha  = (change > LPF_CHANGE_THRESHOLD_G) ? LPF_ALPHA_FAST : LPF_ALPHA_SLOW;
  lpf_output   = (alpha * median_output) + ((1.0f - alpha) * lpf_output);
  return lpf_output;
}

// ────────────────────────────────────────────────────────────
//  Calibration — takes CAL_SAMPLES readings and averages
//
//  Why more samples = more stable factor:
//    10 samples: factor might vary ±2 between calibrations
//    50 samples: factor varies ±0.2 between calibrations
// ────────────────────────────────────────────────────────────
void doCalibration() {
  Serial.println("\n>> CALIBRATION MODE");
  Serial.println("   Place known weight on scale.");
  Serial.print("   Type weight in grams and press Enter: ");

  while (!Serial.available()) { delay(100); }
  String input = Serial.readStringUntil('\n');
  input.trim();
  float knownWeight = input.toFloat();
  if (knownWeight <= 0) { Serial.println("   Cancelled."); return; }

  Serial.println("   Reading " + String(CAL_SAMPLES) + " samples, please wait...");

  // Remove scale factor so we get raw ADC counts
  scale.set_scale();

  // Take many readings and average them for a stable result
  double sum = 0;
  for (int i = 0; i < CAL_SAMPLES; i++) {
    sum += scale.get_units(1);   // 1 sample at a time, we average ourselves
    delay(20);
    if (i % 10 == 9) Serial.print(".");  // progress dots
  }
  Serial.println();

  float rawAvg    = (float)(sum / CAL_SAMPLES);
  float newFactor = rawAvg / knownWeight;

  scale.set_scale(newFactor);
  calibrationFactor = newFactor;

  saveCalibration(newFactor);
  resetFilters(knownWeight);

  Serial.println("\n   ╔══════════════════════════════════════╗");
  Serial.println("   ║  Calibration complete!               ║");
  Serial.print(  "   ║  Factor : "); Serial.print(newFactor, 4);
  Serial.println("             ║");
  Serial.print(  "   ║  Raw avg: "); Serial.print(rawAvg, 2);
  Serial.println("          ║");
  Serial.println("   ╚══════════════════════════════════════╝");
  Serial.println("   Saved to flash. No re-upload needed.");
  Serial.println();
}
// ─────────────────────────────────────────────
//  SEND VALIDATION GATE (MISSING IN YOUR CODE)
// ─────────────────────────────────────────────

static float last_sent_weight = 0.0f;

bool shouldSendReading(float display, bool is_stable)
{
  // Reject negative values
  if (display < 0)
    return false;

  // Match your existing zero-band logic
  if (display < ZERO_BAND_G)
    return false;

  // Only send stable readings
  if (!is_stable)
    return false;

  // Don't repeatedly send nearly identical values
  if (fabs(display - last_sent_weight) < 1.0f)
    return false;

  last_sent_weight = display;
  return true;
}

// ════════════════════════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);

  rtc_cpu_freq_config_t config;
  rtc_clk_cpu_freq_get_config(&config);
  rtc_clk_cpu_freq_to_config(RTC_CPU_FREQ_80M, &config);
  rtc_clk_cpu_freq_set_config_fast(&config);

  Serial.println("=== HX711 — Stable Filter + Reliable Calibration ===");

  calibrationFactor = loadCalibration();
  Serial.print("Calibration factor loaded: ");
  Serial.println(calibrationFactor, 4);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibrationFactor);

  backendConfig.baseUrl = "http://10.251.67.72:3002/api/weight";
  backendConfig.deviceId = "esp32-scale-01";
  backendConfig.apiKey = "";
  backendConfig.timeoutMs = 5000;

  BackendApi::connectWiFi(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Settling 5s...");
  delay(5000);
  scale.tare(TARE_SAMPLES);
  Serial.println(" tare done.");
  Serial.println();
  Serial.println("Commands: t=tare  r=raw  c=calibrate  +=up  -=down  x=clear  s=settings");
  Serial.println("═══════════════════════════════════════════════════════");
}

// ════════════════════════════════════════════════════════════
//  LOOP
// ════════════════════════════════════════════════════════════
void loop() {

  // ── Serial commands ───────────────────────────────────────
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() > 0) {
      char cmd = tolower(input.charAt(0));

      if (cmd == 't') {
        scale.tare(TARE_SAMPLES);
        resetFilters(0.0f);
        Serial.println("Tare done.");

      } else if (cmd == 'r') {
        Serial.println("Raw: " + String(scale.get_value(READ_SAMPLES)));

      } else if (cmd == 'c') {
        doCalibration();

      } else if (cmd == '+') {
        calibrationFactor += 1.0;
        scale.set_scale(calibrationFactor);
        saveCalibration(calibrationFactor);
        Serial.println("Factor → " + String(calibrationFactor, 4));

      } else if (cmd == '-') {
        calibrationFactor -= 1.0;
        scale.set_scale(calibrationFactor);
        saveCalibration(calibrationFactor);
        Serial.println("Factor → " + String(calibrationFactor, 4));

      } else if (cmd == 'x') {
        clearCalibration();
        resetFilters(0.0f);

      } else if (cmd == 's') {
        Serial.println("\n  Current settings:");
        Serial.println("  Factor        : " + String(calibrationFactor, 4));
        Serial.println("  Flush threshold: " + String(FLUSH_THRESHOLD_G, 0) + "g (needs " + String(FLUSH_CONFIRM_COUNT) + " readings to confirm)");
        Serial.println("  LPF fast alpha : " + String(LPF_ALPHA_FAST) + " (when change > " + String(LPF_CHANGE_THRESHOLD_G, 0) + "g)");
        Serial.println("  LPF slow alpha : " + String(LPF_ALPHA_SLOW));
        Serial.println("  Median size    : " + String(MEDIAN_SIZE));
        Serial.println();
      }
    }
  }

  // ── Read and filter ───────────────────────────────────────
  static float prev_smoothed  = 0.0f;
  static int   stable_counter = 0;

  float raw_sample   = scale.get_units(READ_SAMPLES);
  float after_median = applyMedianFilter(raw_sample);
  float after_lpf    = applyDynamicLPF(after_median, raw_sample);

  // Zero deadband
  float display = after_lpf;
  if (fabsf(after_median) < ZERO_BAND_G && fabsf(after_lpf) < ZERO_BAND_G) {
    zero_confirm_count++;
    if (zero_confirm_count >= ZERO_RESET_COUNT) {
      display = 0.0f;
      resetFilters(0.0f);
    }
  } else {
    zero_confirm_count = 0;
    if (fabsf(display) < ZERO_BAND_G) display = 0.0f;
  }

  // Stability check
  if (rawcount == MEDIAN_SIZE && fabsf(display - prev_smoothed) <= STABLE_THRESHOLD_G) {
    stable_counter++;
  } else {
    stable_counter = 0;
  }
  bool is_stable = (rawcount == MEDIAN_SIZE) && (stable_counter >= STABLE_COUNT);
  prev_smoothed  = display;

  // ── Print ─────────────────────────────────────────────────
  float change = fabsf(raw_sample - after_lpf);
  String mode  = (change > LPF_CHANGE_THRESHOLD_G) ? "FAST" : "slow";

  Serial.print("Raw: ");      Serial.print(raw_sample,   1); Serial.print("g");
  Serial.print("  Median: "); Serial.print(after_median, 1); Serial.print("g");
  Serial.print("  LPF[");     Serial.print(mode);
  Serial.print("]: ");        Serial.print(display,      1); Serial.print("g");
  if (is_stable) Serial.print("  [STABLE]");
  Serial.println();

  String responseBody;
 if (shouldSendReading(display, is_stable)) {
    bool sentOk = BackendApi::postReading(
      backendConfig,
      raw_sample,
      after_median,
      after_lpf,
      display,
      is_stable,
      &responseBody
    );

    Serial.print("[HTTP] send ");
    Serial.println(sentOk ? "ok" : "failed");
  } else {
    Serial.println("[HTTP] skipped: invalid or empty reading");
  }

  delay(500);  // slightly faster loop
}
