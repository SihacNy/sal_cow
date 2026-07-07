/*
  HX711 MQTT publish example for ESP32

  Publishes a JSON payload to an MQTT broker only when the scale state changes:
  - occupied: an object is on the scale and the measured weight is above the trigger threshold
  - empty: no object is on the scale, weight is reported as 0 g once

  MQTT broker note:
  Mosquitto is the broker. Replace the broker host below with your Mosquitto IP or hostname.
*/

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "soc/rtc.h"
#include "HX711.h"

// HX711 wiring
const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN = 22;

// Calibration
const float CALIBRATION_FACTOR = -109.6f;
const int TARE_SAMPLES = 30;
const int READ_SAMPLES = 20;

// Presence detection
const float EMPTY_BAND_G = 3.0f;
const float OCCUPIED_TRIGGER_G = 5.0f;
const unsigned long STARTUP_SETTLE_MS = 5000;
const unsigned long SAMPLE_PERIOD_MS = 1000;

// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MQTT broker settings
const char* MQTT_BROKER = "192.168.1.10";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "hx711-scale-1";
const char* MQTT_TOPIC = "sensors/hx711/weight";
const char* MQTT_USERNAME = "";
const char* MQTT_PASSWORD = "";

HX711 scale;
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

bool lastOccupied = false;
unsigned long lastSampleAt = 0;

static void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

static void connectMqtt() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  while (!mqttClient.connected()) {
    if (strlen(MQTT_USERNAME) > 0) {
      mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
    } else {
      mqttClient.connect(MQTT_CLIENT_ID);
    }

    if (!mqttClient.connected()) {
      delay(1000);
    }
  }
}

static void publishWeight(float weightG, bool occupied) {
  if (!mqttClient.connected()) {
    connectMqtt();
  }

  char payload[160];
  const char* state = occupied ? "occupied" : "empty";
  if (!occupied) {
    weightG = 0.0f;
  }

  snprintf(payload, sizeof(payload),
           "{\"device_id\":\"%s\",\"state\":\"%s\",\"weight_g\":%.2f}",
           MQTT_CLIENT_ID, state, weightG);
  mqttClient.publish(MQTT_TOPIC, payload, false);
}

void setup() {
  Serial.begin(115200);

  rtc_cpu_freq_config_t config;
  rtc_clk_cpu_freq_get_config(&config);
  rtc_clk_cpu_freq_to_config(RTC_CPU_FREQ_80M, &config);
  rtc_clk_cpu_freq_set_config_fast(&config);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(CALIBRATION_FACTOR);

  connectWiFi();
  connectMqtt();

  delay(STARTUP_SETTLE_MS);
  scale.tare(TARE_SAMPLES);
}

void loop() {
  connectWiFi();
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  if (millis() - lastSampleAt < SAMPLE_PERIOD_MS) {
    return;
  }
  lastSampleAt = millis();

  if (!scale.is_ready()) {
    return;
  }

  float weightG = scale.get_units(READ_SAMPLES);
  if (fabsf(weightG) < EMPTY_BAND_G) {
    weightG = 0.0f;
  }

  bool occupied = weightG >= OCCUPIED_TRIGGER_G;

  if (occupied != lastOccupied) {
    publishWeight(weightG, occupied);
    lastOccupied = occupied;
  }
}