#pragma once

#include <Arduino.h>
#include <WiFi.h>

namespace BackendApi {

struct Config {
  String baseUrl;
  String deviceId;
  String apiKey;
  unsigned long timeoutMs = 5000;
};

inline bool connectWiFi(const char *ssid,
                        const char *password,
                        unsigned long timeoutMs = 15000) {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startMs) < timeoutMs) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected. IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    return true;
  }

  Serial.print("[WiFi] Failed. Status=");
  Serial.println((int)WiFi.status());
  return false;
}

inline bool postReading(const Config &config,
                        float rawValue,
                        float medianValue,
                        float lpfValue,
                        float displayValue,
                        bool stable,
                        String *responseBody = nullptr) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Skipped: WiFi not connected");
    return false;
  }

  String payload = "{";
  payload += "\"device_id\":\"" + config.deviceId + "\"";
  payload += ",\"raw\":" + String(rawValue, 1);
  payload += ",\"median\":" + String(medianValue, 1);
  payload += ",\"lpf\":" + String(lpfValue, 1);
  payload += ",\"display\":" + String(displayValue, 1);
  payload += ",\"stable\":";
  payload += stable ? "true" : "false";
  payload += "}";

  String url = config.baseUrl;
  if (url.startsWith("http://")) {
    url = url.substring(7);
  } else if (url.startsWith("https://")) {
    url = url.substring(8);
  }

  String host;
  String path = "/";
  uint16_t port = 80;

  int slashIndex = url.indexOf('/');
  if (slashIndex >= 0) {
    host = url.substring(0, slashIndex);
    path = url.substring(slashIndex);
  } else {
    host = url;
  }

  int portIndex = host.indexOf(':');
  if (portIndex >= 0) {
    port = (uint16_t)host.substring(portIndex + 1).toInt();
    host = host.substring(0, portIndex);
  }

  WiFiClient client;
  client.setTimeout(config.timeoutMs / 1000);

  Serial.print("[HTTP] POST ");
  Serial.print(host);
  Serial.print(":");
  Serial.print(port);
  Serial.println(path);

  if (!client.connect(host.c_str(), port)) {
    Serial.println("[HTTP] Connect failed");
    return false;
  }

  client.print(String("POST ") + path + " HTTP/1.1\r\n");
  client.print(String("Host: ") + host + "\r\n");
  client.print("Connection: close\r\n");
  client.print("Content-Type: application/json\r\n");
  client.print(String("Content-Length: ") + payload.length() + "\r\n");

  if (config.apiKey.length() > 0) {
    client.print(String("Authorization: Bearer ") + config.apiKey + "\r\n");
  }

  client.print("\r\n");
  client.print(payload);

  String response;
  unsigned long startMs = millis();
  while ((millis() - startMs) < config.timeoutMs) {
    while (client.available()) {
      char c = (char)client.read();
      response += c;
    }

    if (!client.connected()) {
      break;
    }

    delay(1);
  }

  client.stop();

  int statusCode = -1;
  int firstLineEnd = response.indexOf('\n');
  if (firstLineEnd > 0) {
    String statusLine = response.substring(0, firstLineEnd);
    int firstSpace = statusLine.indexOf(' ');
    if (firstSpace > 0) {
      statusCode = statusLine.substring(firstSpace + 1).toInt();
    }
  }

  if (responseBody != nullptr) {
    *responseBody = response;
    Serial.print("[HTTP] Response: ");
    Serial.println(*responseBody);
  }

  Serial.print("[HTTP] Status code: ");
  Serial.println(statusCode);

  return statusCode >= 200 && statusCode < 400;
}

}  // namespace BackendApi