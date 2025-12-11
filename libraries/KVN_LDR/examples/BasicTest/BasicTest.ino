/*
 * KVN_LDR Basic Test Example
 *
 * Tests LDR functionality and prints readings to Serial Monitor
 *
 * Hardware:
 *   - 5528 LDR between 3.3V and GPIO pin
 *   - 10kΩ resistor between GPIO pin and GND
 *
 * For ESP32-C6: Use GPIO 0
 * For ESP32-C3: Use GPIO 0, 1, 2, 3, or 4
 * For ESP32-S3: Use GPIO 1-10
 * For ESP32-P4: Use any ADC-capable GPIO
 */

#include <KVN_LDR.h>

// Define LDR pin (change based on your wiring)
#define LDR_PIN 0

// Create LDR object
KVN_LDR ldr(LDR_PIN);

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n=== KVN LDR Test ===\n");

    // Initialize LDR
    ldr.begin();

    Serial.println("LDR initialized on GPIO " + String(LDR_PIN));
    Serial.println("Reading every 1 second...\n");
}

void loop() {
    // Print debug information
    ldr.printDebug();

    // Also print JSON format (for MQTT publishing)
    Serial.print("JSON: ");
    Serial.println(ldr.toJSON());

    Serial.println();

    delay(1000);
}
