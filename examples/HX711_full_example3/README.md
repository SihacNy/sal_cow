# HX711_full_example3 — MQTT publish example

## Overview
This sketch reads an HX711 load cell on an ESP32 and publishes a small JSON payload to an MQTT broker only when the scale state changes:
- "occupied": an object is detected on the scale (weight above a trigger)
- "empty": object removed, a single message with weight 0 g is sent

It avoids continuous spam by publishing only on state transitions (empty → occupied and occupied → empty).

## Files
- `HX711_full_example3.ino` — the example sketch. See: [examples/HX711_full_example3/HX711_full_example3.ino](examples/HX711_full_example3/HX711_full_example3.ino)

## What the code does (simple terms)
- Includes WiFi, an MQTT client (`PubSubClient`) and the `HX711` library.
- Connects the ESP32 to your WiFi network.
- Connects to an MQTT broker (Mosquitto expected; you can use any MQTT broker).
- Initializes the HX711, applies a calibration factor, and runs a tare to zero the scale.
- Periodically (every second) reads the averaged weight from the HX711.
- Applies a small dead-band so tiny noise is treated as 0 g.
- Decides whether the scale is "occupied" using `OCCUPIED_TRIGGER_G` (default 5 g).
- If the occupied/empty state changed since the last reading, builds a JSON payload and publishes it to the configured MQTT topic.

## Payload format
- Occupied example:
  {
    "device_id": "hx711-scale-1",
    "state": "occupied",
    "weight_g": 123.45
  }
- Empty example (sent once when object removed):
  {
    "device_id": "hx711-scale-1",
    "state": "empty",
    "weight_g": 0.00
  }

The payload is intentionally minimal so your broker and downstream systems can filter easily.

## Configuration (what to edit in the sketch)
Open `examples/HX711_full_example3/HX711_full_example3.ino` and update the following values near the top of the file:
- WiFi: `WIFI_SSID`, `WIFI_PASSWORD`
- MQTT broker: `MQTT_BROKER` (IP or hostname), `MQTT_PORT` (default `1883`)
- MQTT credentials (if your broker requires): `MQTT_USERNAME`, `MQTT_PASSWORD`
- Topic and client id: `MQTT_TOPIC`, `MQTT_CLIENT_ID` (optional to set)
- Calibration: `CALIBRATION_FACTOR` — adjust this after calibration (see below)
- Thresholds: `EMPTY_BAND_G` (treat small values as zero), `OCCUPIED_TRIGGER_G` (when the scale is considered occupied)

## How to calibrate the scale (quick)
1. Leave the sketch as-is and open Serial Monitor (115200).
2. Call `scale.set_scale()` and `scale.tare()` from the sketch startup (the example already sets tare on startup).
3. Place a known weight (for example 500 g) on the scale.
4. Read the reported `weight_g` from the serial output (or use `scale.get_units(10)` manually).
5. Compute a new calibration factor if needed: if the sketch prints `reading` for known weight `W_known`, then
   new_factor = (reading) / W_known
   Use that value in `CALIBRATION_FACTOR` (the sketch uses `scale.set_scale(CALIBRATION_FACTOR)`).
6. Re-upload the sketch and verify accuracy.

## How to run and test
1. Edit the sketch per "Configuration" above.
2. Build and upload using PlatformIO (from your project root):

```bash
# Build and upload to the default ESP32 environment
platformio run -e esp32dev --target upload
```

3. Start (or confirm) your Mosquitto broker on the local network. On a Linux machine you can start mosquitto with:

```bash
sudo systemctl start mosquitto
# or launch in foreground for testing
mosquitto -v
```

4. Monitor the topic from a machine with `mosquitto-clients` installed:

```bash
mosquitto_sub -h 192.168.1.10 -t "sensors/hx711/weight" -v
```
Replace `192.168.1.10` with your broker IP and topic if you changed it.

5. Put an object on the scale and remove it. You should see one JSON message when the object is placed and one when removed (with weight_g = 0.00).

## Troubleshooting
- No MQTT messages:
  - Ensure WiFi credentials are correct and the ESP32 is online.
  - Ensure `MQTT_BROKER` points to a reachable broker and port 1883 is open.
  - If the broker requires auth, set `MQTT_USERNAME`/`MQTT_PASSWORD`.
- Too many or noisy messages:
  - Increase `OCCUPIED_TRIGGER_G` to ignore light noise.
  - Increase read averaging (`READ_SAMPLES`) to reduce jitter.
- Wrong weight reading:
  - Re-run calibration steps and adjust `CALIBRATION_FACTOR`.

## Checklist (what to do now)
- [ ] Edit `WIFI_SSID` and `WIFI_PASSWORD` in the sketch.
- [ ] Replace `MQTT_BROKER` with your broker IP (or hostname).
- [ ] Optionally set `MQTT_USERNAME` and `MQTT_PASSWORD` if required.
- [ ] Tune `CALIBRATION_FACTOR` using a known weight.
- [ ] Tune `OCCUPIED_TRIGGER_G` and `EMPTY_BAND_G` to fit your load cell and setup.
- [ ] Build and upload the sketch using PlatformIO.
- [ ] Use `mosquitto_sub` or another MQTT client to monitor the topic and verify messages.

## Where to go next (optional enhancements)
- Publish additional fields (battery level, uptime, raw ADC reading) if needed.
- Add reconnection/backoff logic or persistent last-will message for online/offline state.
- Use TLS or username/password for secured brokers.


---
Generated by your assistant. If you want, I can also add a small `examples/HX711_full_example3/notes.md` with your custom calibration numbers and test results.