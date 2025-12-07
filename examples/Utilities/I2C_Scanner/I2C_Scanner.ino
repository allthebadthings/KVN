#include <Wire.h>

void setup() {
  Serial.begin(115200);
  while (!Serial) {}
  Serial.println("\nI2C Scanner (ESP32)");

  Wire.begin();
  Serial.println("Starting scan...");
}

void loop() {
  byte error;
  uint8_t address;
  int found = 0;

  Serial.println("\nScanning...");
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("I2C device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println();
      found++;
    } else if (error == 4) {
      Serial.print("Unknown error at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }

  if (found == 0) {
    Serial.println("No I2C devices found");
  } else {
    Serial.print("Scan complete. Devices: ");
    Serial.println(found);
  }

  Serial.println("Waiting 5s before next scan...");
  delay(5000);
}
