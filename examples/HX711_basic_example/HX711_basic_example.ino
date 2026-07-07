#include "HX711.h"

// HX711 circuit wiring
#if defined(ARDUINO_ARCH_ESP32)
const int LOADCELL_DOUT_PIN = 21;
const int LOADCELL_SCK_PIN = 22;
#else
const int LOADCELL_DOUT_PIN = 2;
const int LOADCELL_SCK_PIN = 3;
#endif

HX711 scale;

void setup() {
  Serial.begin(57600);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
}

void loop() {

  if (scale.is_ready()) {
    long reading = scale.read();
    Serial.print("HX711 reading: ");
    Serial.println(reading);
  } else {
    Serial.println("HX711 not found.");
  }

  delay(1000);
  
}
