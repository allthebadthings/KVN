# KVN_LDR Library

**Unified Light Sensor Library for KVN Smart Home System**

Simple, powerful LDR (Light Dependent Resistor) interface for all ESP32-based KVN devices.

## Features

✅ **Auto-Brightness** - Automatic display/LED brightness control
✅ **Ambient Light Monitoring** - Track room lighting levels
✅ **Day/Night Detection** - No RTC required
✅ **MQTT Integration** - Publish light data to Home Assistant
✅ **Lux Estimation** - Approximate lux from ADC readings
✅ **Smart Smoothing** - Exponential moving average filter
✅ **Change Detection** - Only publish when light changes significantly
✅ **Auto-Calibration** - Easy setup for different lighting conditions
✅ **Multi-Device** - Works on ESP32-P4, S3, C3, C6

## Hardware Requirements

- **LDR:** 5528 photoresistor (or similar)
- **Resistor:** 10kΩ (voltage divider)
- **Pin:** Any ADC-capable GPIO

### Circuit Diagram

```
        ESP32
     ┌──────────┐
3.3V ┤          │
     │  ┌────┐  │
     └──┤LDR │  │
        └────┘  │
          │     │
          ├─────┤ GPIO (ADC)
          │     │
        ┌─┴─┐   │
        │10k│   │
        └─┬─┘   │
          │     │
 GND ─────┴─────┘
```

## Installation

### Option 1: Arduino IDE

1. Copy `KVN_LDR` folder to:
   - **macOS:** `~/Documents/Arduino/libraries/`
   - **Windows:** `Documents\Arduino\libraries\`
   - **Linux:** `~/Arduino/libraries/`

2. Restart Arduino IDE

3. Go to **Sketch → Include Library** → verify "KVN_LDR" appears

### Option 2: PlatformIO

Add to `platformio.ini`:

```ini
lib_deps =
    KVN_LDR
```

Or copy library to `lib/` folder in your project.

## Quick Start

### Basic Usage

```cpp
#include <KVN_LDR.h>

#define LDR_PIN 0

KVN_LDR ldr(LDR_PIN);

void setup() {
    Serial.begin(115200);
    ldr.begin();
}

void loop() {
    // Get ambient light in lux
    uint16_t lux = ldr.getLux();

    Serial.print("Light level: ");
    Serial.print(lux);
    Serial.println(" lux");

    delay(1000);
}
```

### Auto-Brightness

```cpp
#include <KVN_LDR.h>

#define LDR_PIN 0
#define BACKLIGHT_PIN 22

KVN_LDR ldr(LDR_PIN);

void setup() {
    ldr.begin();
    pinMode(BACKLIGHT_PIN, OUTPUT);
}

void loop() {
    // Get brightness (0-255) with gamma correction
    uint8_t brightness = ldr.getBrightness(30, 255, true);
    analogWrite(BACKLIGHT_PIN, brightness);

    delay(500);
}
```

### MQTT Publishing

```cpp
#include <KVN_LDR.h>
#include <PubSubClient.h>

KVN_LDR ldr(0);

void loop() {
    if (ldr.hasChanged(200)) {  // Changed > 200 ADC units
        String json = ldr.toJSON();
        mqtt.publish("sensor/ambient_light", json.c_str());
    }
}
```

## API Reference

### Constructor

```cpp
KVN_LDR(uint8_t pin, uint16_t minADC = 500, uint16_t maxADC = 3500)
```

- **pin:** GPIO pin connected to LDR voltage divider
- **minADC:** ADC value in darkest condition (default: 500)
- **maxADC:** ADC value in brightest condition (default: 3500)

### Methods

#### Initialization

```cpp
void begin()
```

Initialize LDR and configure ADC (call in `setup()`)

---

#### Reading Values

```cpp
uint16_t readRaw()
```

Read raw ADC value (0-4095 for 12-bit ADC)

```cpp
uint16_t readSmoothed()
```

Read smoothed value using exponential moving average

```cpp
uint16_t getLux()
```

Get estimated ambient light in lux (approximate)

```cpp
uint8_t getLightLevel()
```

Get categorical light level:
- `LDR_LEVEL_DARK` (< 10 lux)
- `LDR_LEVEL_DIM` (10-50 lux)
- `LDR_LEVEL_NORMAL` (50-200 lux)
- `LDR_LEVEL_BRIGHT` (200-1000 lux)
- `LDR_LEVEL_VERY_BRIGHT` (> 1000 lux)

---

#### Auto-Brightness

```cpp
uint8_t getBrightness(uint8_t minBrightness = 30,
                      uint8_t maxBrightness = 255,
                      bool useGamma = true)
```

Get display brightness (0-255) mapped from light level

- **minBrightness:** Minimum PWM value (night mode)
- **maxBrightness:** Maximum PWM value (bright mode)
- **useGamma:** Apply gamma 2.2 correction for perceived brightness

---

#### Logic Functions

```cpp
bool isDay(uint16_t threshold = 1500)
```

Returns `true` if ambient light > threshold (daylight detection)

```cpp
bool hasChanged(uint16_t threshold = 200)
```

Returns `true` if light changed by more than threshold since last call
(useful for avoiding redundant MQTT publishes)

---

#### Data Export

```cpp
String toJSON()
```

Returns JSON string with all sensor data:

```json
{
  "raw": 2847,
  "lux": 156,
  "level": 2,
  "is_day": true
}
```

---

#### Calibration

```cpp
void setCalibration(uint16_t minADC, uint16_t maxADC)
```

Manually set ADC calibration values

```cpp
void autoCalibrate(uint16_t samples = 100, uint16_t delayMs = 10)
```

Interactive auto-calibration:
1. Prompts to cover LDR (measures dark)
2. Prompts to expose to bright light (measures bright)
3. Sets calibration automatically

---

#### Debug

```cpp
void printDebug()
```

Print formatted debug output to Serial:

```
LDR: Raw=2847 | Lux=156 | Level=NORMAL | Brightness=178/255 | Day=YES
```

## Examples

### Example 1: Basic Light Monitoring

Monitor and print ambient light every second.

```cpp
#include <KVN_LDR.h>

KVN_LDR ldr(0);

void setup() {
    Serial.begin(115200);
    ldr.begin();
}

void loop() {
    ldr.printDebug();
    delay(1000);
}
```

**Output:**
```
LDR: Raw=2847 | Lux=156 | Level=NORMAL | Brightness=178/255 | Day=YES
LDR: Raw=2834 | Lux=154 | Level=NORMAL | Brightness=176/255 | Day=YES
```

---

### Example 2: Day/Night Automation

Turn on lights only at night.

```cpp
#include <KVN_LDR.h>

#define LDR_PIN 0
#define RELAY_PIN 5

KVN_LDR ldr(LDR_PIN);

void setup() {
    ldr.begin();
    pinMode(RELAY_PIN, OUTPUT);
}

void loop() {
    if (ldr.isDay()) {
        digitalWrite(RELAY_PIN, LOW);  // Lights OFF
    } else {
        digitalWrite(RELAY_PIN, HIGH); // Lights ON
    }

    delay(60000);  // Check every minute
}
```

---

### Example 3: Multi-Room Light Tracking

Track light levels in multiple rooms.

```cpp
#include <KVN_LDR.h>

KVN_LDR livingRoom(0);
KVN_LDR bedroom(1);
KVN_LDR kitchen(2);

void setup() {
    Serial.begin(115200);
    livingRoom.begin();
    bedroom.begin();
    kitchen.begin();
}

void loop() {
    Serial.println("=== Room Light Levels ===");

    Serial.print("Living Room: ");
    Serial.print(livingRoom.getLux());
    Serial.println(" lux");

    Serial.print("Bedroom: ");
    Serial.print(bedroom.getLux());
    Serial.println(" lux");

    Serial.print("Kitchen: ");
    Serial.print(kitchen.getLux());
    Serial.println(" lux");

    Serial.println();
    delay(5000);
}
```

---

### Example 4: Power Saving (Deep Sleep)

Wake ESP32 only at night for motion detection.

```cpp
#include <KVN_LDR.h>

KVN_LDR ldr(0);

void setup() {
    ldr.begin();

    if (ldr.isDay()) {
        // Daylight - go back to sleep for 1 hour
        esp_sleep_enable_timer_wakeup(3600 * 1000000ULL);
        esp_deep_sleep_start();
    }

    // It's night - proceed with motion detection
    // ... your code here ...
}
```

---

## Device-Specific Pins

### ESP32-C6-LCD-1.47 (MQTT Relay)

```cpp
#define LDR_PIN 0  // GPIO 0
```

Available ADC pins: 0, 1, 2, 3, 4, 5

---

### ESP32-C3 Scout Nodes

```cpp
#define LDR_PIN 0  // GPIO 0 recommended
```

Available ADC pins: 0, 1, 2, 3, 4

**Note:** ESP32-C3 has limited GPIO. Check your pin usage!

---

### ESP32-S3 Watchtower Nodes

```cpp
#define LDR_PIN 1  // GPIO 1 recommended
```

Available ADC pins: 1-10

---

### ESP32-P4 Hub

```cpp
#define LDR_PIN 1  // GPIO 1 recommended
```

Consult ESP32-P4 datasheet for ADC-capable pins.

---

## Calibration Guide

### Method 1: Manual Calibration

1. **Find dark value:**
   ```cpp
   ldr.begin();
   Serial.println(ldr.readRaw());  // Cover LDR, note value
   ```

2. **Find bright value:**
   ```cpp
   // Expose to bright light, note value
   ```

3. **Set calibration:**
   ```cpp
   ldr.setCalibration(600, 3200);  // Your measured values
   ```

### Method 2: Auto-Calibration

```cpp
void setup() {
    Serial.begin(115200);
    ldr.begin();
    ldr.autoCalibrate();  // Follow prompts in Serial Monitor
}
```

**Serial Output:**
```
LDR Auto-Calibration Starting...
Cover the LDR (darkest condition)...
Dark ADC: 584
Now expose LDR to bright light...
Bright ADC: 3124
Calibration complete!
Min ADC: 526
Max ADC: 3436
```

---

## Troubleshooting

### Issue: Always shows maximum brightness

**Cause:** LDR connected backwards or voltage divider incorrect

**Solution:**
- Verify LDR is between 3.3V and GPIO pin
- 10kΩ resistor should be between GPIO and GND

---

### Issue: Values don't change with light

**Cause:** ADC not configured or wrong pin

**Solution:**
```cpp
// Ensure you call begin()
ldr.begin();

// Check pin is ADC-capable
// ESP32-C6: GPIO 0-5
// ESP32-C3: GPIO 0-4
```

---

### Issue: Brightness flickers

**Cause:** Noise in ADC readings

**Solution:**
- Use `readSmoothed()` instead of `readRaw()`
- Add 0.1µF capacitor between GPIO and GND
- Use shielded wire for LDR connection

---

### Issue: Inaccurate lux values

**Cause:** LDR spectral response varies, calibration needed

**Note:** Lux values are approximate. For accurate measurements, use a dedicated lux meter like BH1750.

---

## Performance

| Metric | Value |
|--------|-------|
| Read time | ~100µs |
| Memory (RAM) | 24 bytes |
| Memory (Flash) | ~4KB |
| Update rate | Up to 1kHz |
| ADC resolution | 12-bit (0-4095) |
| Smoothing delay | ~100ms |

---

## Integration with KVN System

### Use Cases Across Devices

| Device | LDR Use Case |
|--------|--------------|
| **ESP32-P4 Hub** | Dashboard backlight, day/night mode |
| **ESP32-S3 Watchtower** | Display brightness, room occupancy correlation |
| **ESP32-C3 Scout** | Deep sleep optimization, window light detection |
| **ESP32-C6 MQTT Relay** | Status display brightness |

### MQTT Topics (Standard)

```
homeassistant/sensor/{device_id}/ambient_light    # Full JSON
homeassistant/sensor/{device_id}/lux              # Lux value only
homeassistant/sensor/{device_id}/light_level      # Category (0-4)
```

### Home Assistant Auto-Discovery

```cpp
// Publish discovery message (once on boot)
String discoveryTopic = "homeassistant/sensor/" + deviceId + "/lux/config";
String discoveryPayload = "{\"name\":\"" + deviceName + " Light\",";
discoveryPayload += "\"stat_t\":\"homeassistant/sensor/" + deviceId + "/lux\",";
discoveryPayload += "\"unit_of_meas\":\"lx\",";
discoveryPayload += "\"dev_cla\":\"illuminance\"}";

mqtt.publish(discoveryTopic.c_str(), discoveryPayload.c_str(), true);
```

---

## License

Part of KVN Coordinator System - Private Project

---

## Version History

- **v1.0.0** (2025-12-08) - Initial release

---

## Support

For issues or questions, see main [KVN Documentation](../../README.md)
