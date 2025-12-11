/*
 * KVN_LDR.cpp - Implementation
 */

#include "KVN_LDR.h"
#include <math.h>

KVN_LDR::KVN_LDR(uint8_t pin, uint16_t minADC, uint16_t maxADC) {
    _pin = pin;
    _minADC = minADC;
    _maxADC = maxADC;
    _lastRaw = 0;
    _smoothedValue = 0;
    _smoothingFactor = 0.1;  // 10% new value, 90% old value
    _lastReadTime = 0;
}

void KVN_LDR::begin() {
    pinMode(_pin, INPUT);

    // Configure ADC (ESP32 specific)
    #if defined(ESP32)
        analogReadResolution(12);  // 12-bit ADC (0-4095)
        analogSetAttenuation(ADC_11db);  // 0-3.3V range
    #endif

    // Initial reading
    _lastRaw = analogRead(_pin);
    _smoothedValue = _lastRaw;
    _lastReadTime = millis();
}

uint16_t KVN_LDR::readRaw() {
    _lastRaw = analogRead(_pin);
    _lastReadTime = millis();
    return _lastRaw;
}

uint16_t KVN_LDR::readSmoothed() {
    uint16_t raw = readRaw();

    // Exponential moving average
    _smoothedValue = (_smoothingFactor * raw) + ((1.0 - _smoothingFactor) * _smoothedValue);

    return (uint16_t)_smoothedValue;
}

uint8_t KVN_LDR::getBrightness(uint8_t minBrightness, uint8_t maxBrightness, bool useGamma) {
    uint16_t ldrValue = readSmoothed();

    // Map ADC reading to brightness range
    int brightness = map(ldrValue, _minADC, _maxADC, minBrightness, maxBrightness);
    brightness = constrain(brightness, minBrightness, maxBrightness);

    // Apply gamma correction for natural perception
    if (useGamma) {
        return applyGamma(brightness);
    }

    return brightness;
}

uint8_t KVN_LDR::getLightLevel() {
    uint16_t lux = getLux();

    if (lux < 10) return LDR_LEVEL_DARK;
    else if (lux < 50) return LDR_LEVEL_DIM;
    else if (lux < 200) return LDR_LEVEL_NORMAL;
    else if (lux < 1000) return LDR_LEVEL_BRIGHT;
    else return LDR_LEVEL_VERY_BRIGHT;
}

uint16_t KVN_LDR::getLux() {
    uint16_t raw = readSmoothed();

    // Approximate lux conversion for 5528 LDR
    // This is a rough approximation - actual lux depends on:
    //   - LDR spectral response
    //   - Resistor value (10kΩ assumed)
    //   - Light spectrum

    // Empirical formula for 5528 with 10kΩ resistor:
    // ADC 500 ≈ 10 lux (dim room)
    // ADC 1500 ≈ 50 lux (normal room)
    // ADC 2500 ≈ 200 lux (bright room)
    // ADC 3500 ≈ 1000 lux (very bright)

    if (raw < 500) return 5;  // Very dark

    // Logarithmic approximation
    float normalized = (raw - 500) / 3000.0;  // 0.0 to 1.0
    uint16_t lux = (uint16_t)(pow(10, normalized * 2.5) * 5);  // 5 to ~1585 lux

    return lux;
}

bool KVN_LDR::isDay(uint16_t threshold) {
    return readSmoothed() > threshold;
}

bool KVN_LDR::hasChanged(uint16_t threshold) {
    static uint16_t lastReportedValue = 0;
    uint16_t current = readSmoothed();

    if (abs((int)current - (int)lastReportedValue) > threshold) {
        lastReportedValue = current;
        return true;
    }

    return false;
}

String KVN_LDR::toJSON() {
    uint16_t raw = readSmoothed();
    uint16_t lux = getLux();
    uint8_t level = getLightLevel();

    String json = "{";
    json += "\"raw\":" + String(raw) + ",";
    json += "\"lux\":" + String(lux) + ",";
    json += "\"level\":" + String(level) + ",";
    json += "\"is_day\":" + String(isDay() ? "true" : "false");
    json += "}";

    return json;
}

void KVN_LDR::setCalibration(uint16_t minADC, uint16_t maxADC) {
    _minADC = minADC;
    _maxADC = maxADC;
}

void KVN_LDR::autoCalibrate(uint16_t samples, uint16_t delayMs) {
    Serial.println("LDR Auto-Calibration Starting...");
    Serial.println("Cover the LDR (darkest condition)...");
    delay(3000);

    // Measure dark condition
    uint32_t darkSum = 0;
    for (uint16_t i = 0; i < samples; i++) {
        darkSum += analogRead(_pin);
        delay(delayMs);
    }
    uint16_t darkAvg = darkSum / samples;

    Serial.print("Dark ADC: ");
    Serial.println(darkAvg);
    Serial.println("\nNow expose LDR to bright light...");
    delay(3000);

    // Measure bright condition
    uint32_t brightSum = 0;
    for (uint16_t i = 0; i < samples; i++) {
        brightSum += analogRead(_pin);
        delay(delayMs);
    }
    uint16_t brightAvg = brightSum / samples;

    Serial.print("Bright ADC: ");
    Serial.println(brightAvg);

    // Set calibration with 10% margin
    _minADC = darkAvg * 0.9;
    _maxADC = brightAvg * 1.1;

    Serial.println("\nCalibration complete!");
    Serial.print("Min ADC: ");
    Serial.println(_minADC);
    Serial.print("Max ADC: ");
    Serial.println(_maxADC);
}

void KVN_LDR::printDebug() {
    uint16_t raw = readSmoothed();
    uint16_t lux = getLux();
    uint8_t level = getLightLevel();
    uint8_t brightness = getBrightness();

    const char* levelNames[] = {"DARK", "DIM", "NORMAL", "BRIGHT", "VERY_BRIGHT"};

    Serial.print("LDR: Raw=");
    Serial.print(raw);
    Serial.print(" | Lux=");
    Serial.print(lux);
    Serial.print(" | Level=");
    Serial.print(levelNames[level]);
    Serial.print(" | Brightness=");
    Serial.print(brightness);
    Serial.print("/255 | Day=");
    Serial.println(isDay() ? "YES" : "NO");
}

uint8_t KVN_LDR::applyGamma(uint8_t value, float gamma) {
    float normalized = value / 255.0;
    float corrected = pow(normalized, gamma);
    return (uint8_t)(corrected * 255);
}
