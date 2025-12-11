/*
 * KVN_LDR.h - Light Dependent Resistor Library
 *
 * Unified LDR interface for all KVN ESP32 devices
 * Supports auto-brightness, ambient light monitoring, and AI integration
 *
 * Compatible with:
 *   - ESP32-P4 Hub
 *   - ESP32-S3 Watchtower Nodes
 *   - ESP32-C3 Scout Nodes
 *   - ESP32-C6 MQTT Relay
 *
 * Hardware: 5528 LDR + 10kΩ voltage divider
 *
 * Author: KVN System
 * Version: 1.0.0
 * Last Updated: 2025-12-08
 */

#ifndef KVN_LDR_H
#define KVN_LDR_H

#include <Arduino.h>

// Light level thresholds (in lux approximation)
#define LDR_LEVEL_DARK      0   // < 10 lux
#define LDR_LEVEL_DIM       1   // 10-50 lux
#define LDR_LEVEL_NORMAL    2   // 50-200 lux
#define LDR_LEVEL_BRIGHT    3   // 200-1000 lux
#define LDR_LEVEL_VERY_BRIGHT 4 // > 1000 lux

class KVN_LDR {
public:
    // Constructor
    KVN_LDR(uint8_t pin, uint16_t minADC = 500, uint16_t maxADC = 3500);

    // Initialization
    void begin();

    // Read raw ADC value (0-4095 for 12-bit)
    uint16_t readRaw();

    // Read with smoothing (exponential moving average)
    uint16_t readSmoothed();

    // Get brightness value (0-255) for display backlight
    uint8_t getBrightness(uint8_t minBrightness = 30, uint8_t maxBrightness = 255, bool useGamma = true);

    // Get light level category
    uint8_t getLightLevel();

    // Get estimated lux value (approximate)
    uint16_t getLux();

    // Check if it's day or night (simple threshold)
    bool isDay(uint16_t threshold = 1500);

    // Check if light level changed significantly (for triggering events)
    bool hasChanged(uint16_t threshold = 200);

    // Get JSON string for MQTT publishing
    String toJSON();

    // Calibration helpers
    void setCalibration(uint16_t minADC, uint16_t maxADC);
    void autoCalibrate(uint16_t samples = 100, uint16_t delayMs = 10);

    // Debug output
    void printDebug();

private:
    uint8_t _pin;
    uint16_t _minADC;
    uint16_t _maxADC;
    uint16_t _lastRaw;
    uint16_t _smoothedValue;
    float _smoothingFactor;
    unsigned long _lastReadTime;

    // Gamma correction for perceived brightness
    uint8_t applyGamma(uint8_t value, float gamma = 2.2);
};

#endif // KVN_LDR_H
