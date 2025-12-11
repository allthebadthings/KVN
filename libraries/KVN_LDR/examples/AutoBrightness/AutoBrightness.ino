/*
 * KVN_LDR Auto-Brightness Example
 *
 * Automatically adjusts LED/display backlight based on ambient light
 *
 * Hardware:
 *   - 5528 LDR + 10kΩ voltage divider on LDR_PIN
 *   - LED or display backlight on BACKLIGHT_PIN
 */

#include <KVN_LDR.h>

// Pin definitions (adjust for your board)
#define LDR_PIN 0          // LDR analog input
#define BACKLIGHT_PIN 22   // PWM output for backlight

// Create LDR object
KVN_LDR ldr(LDR_PIN);

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n=== Auto-Brightness Demo ===\n");

    // Initialize LDR
    ldr.begin();

    // Setup backlight pin
    pinMode(BACKLIGHT_PIN, OUTPUT);

    Serial.println("LDR on GPIO " + String(LDR_PIN));
    Serial.println("Backlight on GPIO " + String(BACKLIGHT_PIN));
    Serial.println("\nCover/uncover LDR to see brightness change...\n");
}

void loop() {
    // Get brightness value (0-255) with gamma correction
    uint8_t brightness = ldr.getBrightness(30, 255, true);

    // Apply to backlight
    analogWrite(BACKLIGHT_PIN, brightness);

    // Debug output
    ldr.printDebug();
    Serial.print("Backlight PWM: ");
    Serial.println(brightness);
    Serial.println();

    delay(500);  // Update twice per second
}
