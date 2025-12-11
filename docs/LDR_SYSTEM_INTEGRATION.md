# LDR Integration Across KVN System

**System-Wide Ambient Light Sensing**

Adding 5528 LDR photoresistors to all 18 KVN devices for intelligent lighting control, power optimization, and contextual AI insights.

---

## Overview

Each of the 18 KVN devices will have an LDR sensor:

| Device Type | Quantity | LDR Use Case |
|-------------|----------|--------------|
| ESP32-P4 Hub | 1× | Dashboard backlight, day/night mode |
| ESP32-S3 Watchtower | 10× | Display brightness, room light tracking |
| ESP32-C3 Scout | 6× | Deep sleep optimization, window monitoring |
| ESP32-C6 MQTT Relay | 1× | Status display auto-brightness |
| **TOTAL** | **18×** | **Full-home light awareness** |

---

## Hardware Requirements

### Per Device

- **1× 5528 LDR** (from your 100-pack)
- **1× 10kΩ resistor** (1/4W, ±5%)
- **Wiring:** Soldered or breadboard

### Total Bill of Materials

| Component | Quantity | Cost | Source |
|-----------|----------|------|--------|
| 5528 LDR (100-pack) | 1 pack | $6.99 | Already purchased |
| 10kΩ resistors | 18× | $0.18 | DigiKey/Amazon |
| **Total Cost** | | **~$7.17** | **($0.40 per device)** |

---

## Device-Specific Integration

### 1. ESP32-C6 MQTT Relay ✅ DONE

**Status:** Already implemented

**GPIO Pin:** 0 (ADC1_CH0)

**Features:**
- Auto-brightness for 1.47" LCD display
- Real-time lux monitoring
- MQTT publishing

**Code:** `examples/ESP32_C6_MQTT_Relay/ESP32_C6_MQTT_Relay.ino`

---

### 2. ESP32-P4 Hub (The Brain)

**Recommended GPIO:** 1 (or any ADC-capable pin)

**Use Cases:**
- Web dashboard backlight control
- System-wide day/night mode trigger
- Master light level for AI context
- "All rooms dark" detection for security mode

**Firmware Changes:**

```cpp
#include <KVN_LDR.h>

#define HUB_LDR_PIN 1  // Adjust based on your pinout

KVN_LDR hubLight(HUB_LDR_PIN);

void setup() {
    hubLight.begin();

    // Optional: Auto-calibrate on first boot
    // hubLight.autoCalibrate();
}

void loop() {
    // Publish master light level to MQTT
    if (hubLight.hasChanged(200)) {
        String topic = "vanguard/hub/ambient_light";
        mqtt.publish(topic.c_str(), hubLight.toJSON().c_str());
    }

    // Adjust web dashboard theme
    if (hubLight.isDay()) {
        // Serve light theme CSS
    } else {
        // Serve dark theme CSS
    }
}
```

**MQTT Topics:**
```
vanguard/hub/ambient_light    → Full JSON
vanguard/hub/lux              → Lux value
vanguard/hub/day_mode         → true/false
```

**AI Integration:**
```cpp
// Send to AI for context
String aiContext = "Hub ambient light: " + String(hubLight.getLux()) + " lux. ";
aiContext += hubLight.isDay() ? "Daytime conditions." : "Nighttime conditions.";
```

---

### 3. ESP32-S3 Watchtower Nodes (10×)

**Recommended GPIO:** 1 or 2 (check existing pinout)

**Use Cases:**
- Auto-brightness for OLED/LCD displays
- Per-room light level tracking
- Occupancy correlation (lights on = room in use)
- Window vs. interior room detection

**Firmware Template:**

```cpp
#include <KVN_LDR.h>

#define S3_LDR_PIN 1
#define S3_DISPLAY_BL 10  // Backlight pin

KVN_LDR roomLight(S3_LDR_PIN);

void setup() {
    roomLight.begin();
    pinMode(S3_DISPLAY_BL, OUTPUT);
}

void loop() {
    // Auto-brightness
    uint8_t brightness = roomLight.getBrightness(20, 255, true);
    analogWrite(S3_DISPLAY_BL, brightness);

    // Publish to MQTT
    if (roomLight.hasChanged(150)) {
        String deviceId = "esp32_s3_node" + String(NODE_NUMBER);
        String topic = "homeassistant/sensor/" + deviceId + "/lux";
        mqtt.publish(topic.c_str(), String(roomLight.getLux()).c_str());
    }

    // Room occupancy hint
    static bool wasLightOn = false;
    bool isLightOn = roomLight.getLux() > 100;

    if (isLightOn && !wasLightOn) {
        // Light just turned on - someone entered?
        Serial.println("Room lights activated");
        mqtt.publish("vanguard/s3/room_event", "lights_on");
    }

    wasLightOn = isLightOn;
}
```

**Per-Room MQTT Topics:**
```
homeassistant/sensor/esp32_s3_node1/lux    → Living Room
homeassistant/sensor/esp32_s3_node2/lux    → Bedroom
homeassistant/sensor/esp32_s3_node3/lux    → Kitchen
...
```

---

### 4. ESP32-C3 Scout Nodes (6×)

**Recommended GPIO:** 0 or 1 (limited GPIO available!)

**Use Cases:**
- **Power Optimization** - Deep sleep during daylight
- Window light monitoring (detect curtains open/closed)
- Hallway night-light trigger
- Battery life extension (2-3× longer)

**Ultra-Low-Power Firmware:**

```cpp
#include <KVN_LDR.h>

#define C3_LDR_PIN 0
#define SLEEP_DURATION_DAY   3600  // 1 hour in daylight
#define SLEEP_DURATION_NIGHT  300  // 5 minutes at night

KVN_LDR scoutLight(C3_LDR_PIN);

void setup() {
    scoutLight.begin();

    // Check if it's daytime
    if (scoutLight.isDay(1500)) {
        // Daylight - go to deep sleep
        Serial.println("Daytime detected - sleeping for 1 hour");

        esp_sleep_enable_timer_wakeup(SLEEP_DURATION_DAY * 1000000ULL);
        esp_deep_sleep_start();
    }

    // It's night - proceed with motion detection
    Serial.println("Nighttime - motion detection active");

    // ... your motion sensor code ...
}

void loop() {
    // Monitor motion, publish to MQTT
    // ...

    // Check if dawn - go back to sleep
    if (scoutLight.isDay(1500)) {
        esp_sleep_enable_timer_wakeup(SLEEP_DURATION_DAY * 1000000ULL);
        esp_deep_sleep_start();
    }

    delay(1000);
}
```

**Battery Life Calculation:**

| Mode | Current | Runtime (1000mAh) |
|------|---------|-------------------|
| **Without LDR** (24/7 active) | 80mA | ~12.5 hours |
| **With LDR** (sleep in day) | Avg 35mA | **~28 hours** (2.2× longer) |

**Window Monitoring Example:**

```cpp
// Detect curtains/blinds state
uint16_t lux = scoutLight.getLux();

if (lux > 500) {
    mqtt.publish("vanguard/scout/window_status", "curtains_open");
} else if (lux < 50 && scoutLight.isDay()) {
    mqtt.publish("vanguard/scout/window_status", "curtains_closed");
}
```

---

## Installation Steps (All Devices)

### Step 1: Solder LDR to Each Board

**Standard Wiring for All Devices:**

```
Board GPIO Header
┌─────────────┐
│ 3.3V  [ ]   │──┐
│             │  │
│ GPIO  [ ]   │  │  ┌────────┐
│             │◄─┼──┤  LDR   │
│ GND   [ ]   │  │  └────────┘
│             │  │      ↓
└─────────────┘  │   ┌──┴──┐
                 │   │ 10k │
                 │   └──┬──┘
                 └──────┘
```

1. Solder one LDR leg to **3.3V pad**
2. Solder other LDR leg to **GPIO pin** + one resistor leg
3. Solder other resistor leg to **GND pad**

### Step 2: Install KVN_LDR Library

Copy to Arduino libraries folder:
```bash
cp -r KVN_Coordinator_System/libraries/KVN_LDR ~/Documents/Arduino/libraries/
```

Or symlink:
```bash
ln -s ~/KVN_Coordinator_System/libraries/KVN_LDR ~/Documents/Arduino/libraries/
```

### Step 3: Update Firmware

For each device type, add:

```cpp
#include <KVN_LDR.h>

#define LDR_PIN 0  // Adjust per device

KVN_LDR light(LDR_PIN);

void setup() {
    light.begin();
}

void loop() {
    // Device-specific LDR usage
}
```

### Step 4: Calibrate (Optional)

Run calibration on one device of each type:

```cpp
void setup() {
    light.begin();
    light.autoCalibrate();  // Follow Serial Monitor prompts

    // Note the calibration values
    // Use same values for all devices of this type
}
```

Or manually set after testing:

```cpp
light.setCalibration(600, 3200);  // Your measured values
```

---

## System-Wide Features

### 1. Whole-Home Light Map

MQTT topics create a real-time light map:

```
Living Room:   254 lux  ████████████ BRIGHT
Bedroom:        12 lux  █░░░░░░░░░░░ DARK
Kitchen:       187 lux  █████████░░░ NORMAL
Hallway:        45 lux  ███░░░░░░░░░ DIM
...
```

### 2. Day/Night Mode Automation

```cpp
// On Hub (master controller)
int darkRooms = 0;
int totalRooms = 17;  // All non-hub devices

for (auto& device : devices) {
    if (device.lux < 50) darkRooms++;
}

if (darkRooms == totalRooms) {
    // ALL rooms dark - trigger night mode
    mqtt.publish("vanguard/system/mode", "night");

    // Enable security cameras
    // Arm motion sensors
    // Disable notification sounds
}
```

### 3. Sunrise/Sunset Detection

No internet or RTC required!

```cpp
// Detect sunrise
static bool wasNight = false;
bool isNight = !light.isDay();

if (wasNight && !isNight) {
    Serial.println("☀️ Sunrise detected!");
    mqtt.publish("vanguard/system/event", "sunrise");

    // Trigger morning routine
    // Disable night mode
}

if (!wasNight && isNight) {
    Serial.println("🌙 Sunset detected!");
    mqtt.publish("vanguard/system/event", "sunset");

    // Trigger evening routine
}

wasNight = isNight;
```

### 4. AI Context Enhancement

Send to Claude/GPT for smarter automation:

```cpp
String aiPrompt = "Home status:\n";
aiPrompt += "Living Room: " + String(livingRoomLux) + " lux\n";
aiPrompt += "Bedroom: " + String(bedroomLux) + " lux\n";
aiPrompt += "Kitchen: " + String(kitchenLux) + " lux\n";
aiPrompt += "Time: 2:34 PM\n\n";
aiPrompt += "Bedroom lights are off during daytime. Should I be concerned?";

// Send to AI API
String response = callClaudeAPI(aiPrompt);
// Response: "Bedroom lights off at 2:34 PM suggests either nap time or
//            curtains closed. Check motion sensor data to confirm occupancy."
```

### 5. Anomaly Detection

```cpp
// Kitchen lights at 3 AM?
if (kitchenLux > 200 && hour >= 0 && hour <= 4) {
    mqtt.publish("vanguard/alert", "unusual_activity_kitchen");
    // Push notification to phone
}

// All lights off but motion detected?
if (allRoomsDark() && motionDetected()) {
    mqtt.publish("vanguard/alert", "motion_in_darkness");
}
```

---

## Home Assistant Integration

### Auto-Discovery Configuration

```yaml
# Auto-discovered sensors
sensor:
  - platform: mqtt
    name: "Living Room Light"
    state_topic: "homeassistant/sensor/esp32_s3_node1/lux"
    unit_of_measurement: "lx"
    device_class: illuminance

  - platform: mqtt
    name: "Bedroom Light"
    state_topic: "homeassistant/sensor/esp32_s3_node2/lux"
    unit_of_measurement: "lx"
    device_class: illuminance

  # ... repeat for all 18 devices
```

### Dashboard Visualization

```yaml
# Light Level Card
type: custom:mini-graph-card
entities:
  - sensor.living_room_light
  - sensor.bedroom_light
  - sensor.kitchen_light
name: Ambient Light Levels
hours_to_show: 24
line_width: 2
```

### Automation Examples

```yaml
# Auto night mode
automation:
  - alias: "Enable Night Mode"
    trigger:
      - platform: numeric_state
        entity_id: sensor.hub_light_level
        below: 50
    action:
      - service: light.turn_on
        target:
          entity_id: light.night_lights
        data:
          brightness: 30

  # Morning routine
  - alias: "Sunrise Routine"
    trigger:
      - platform: state
        entity_id: binary_sensor.hub_day_mode
        to: "on"
    action:
      - service: scene.turn_on
        target:
          entity_id: scene.morning
```

---

## Troubleshooting

### All Devices Show Maximum Brightness

**Check:**
- LDR orientation (correct leg to 3.3V?)
- Voltage divider: LDR → GPIO → 10kΩ → GND

### One Device Reads Differently

**Solution:**
- Individual calibration per device
- Different ambient lighting per room is expected!

### Erratic Readings

**Fix:**
- Add 0.1µF capacitor GPIO → GND
- Use `readSmoothed()` instead of `readRaw()`
- Shield LDR from LED backlight reflection

---

## Cost Analysis

| Item | Quantity | Cost |
|------|----------|------|
| LDR pack (100×) | 1 | $6.99 (already purchased) |
| 10kΩ resistors (100×) | 1 pack | $1.99 |
| Wire/solder | Misc | ~$2.00 |
| **Total** | | **$10.98** |
| **Per device (18×)** | | **$0.61** |

**Benefits:**
- ✅ $11 total for full-home light awareness
- ✅ 2-3× battery life extension (C3 Scouts)
- ✅ Professional auto-brightness on all displays
- ✅ Rich AI context for automation

---

## Testing Procedure

### Per-Device Test (5 minutes each)

1. **Upload firmware** with LDR library
2. **Open Serial Monitor** (115200 baud)
3. **Check readings:**
   ```
   LDR: Raw=2847 | Lux=156 | Level=NORMAL | Brightness=178/255 | Day=YES
   ```
4. **Cover LDR** with hand → brightness should drop
5. **Shine flashlight** → brightness should increase
6. **Verify MQTT** - check Home Assistant sensor updates

### System-Wide Test

1. Deploy to all 18 devices
2. Check Home Assistant - verify all 18 sensors online
3. Turn off all room lights at night → verify all report DARK
4. Test automation triggers

---

## Maintenance

**Annual:**
- Dust LDRs (compressed air)
- Verify calibration (room lighting may change with seasons/furniture)

**As Needed:**
- Replace LDR if damaged (have 82 spares!)
- Adjust calibration for room remodels

---

## Future Enhancements

- [ ] Machine learning for occupancy prediction based on light patterns
- [ ] Circadian rhythm tracking (natural light exposure)
- [ ] Energy usage correlation (lights vs. power consumption)
- [ ] Weather prediction (rapid darkening = incoming storm)
- [ ] Historical light level database for long-term analysis

---

## Summary

By adding a **$0.61 sensor** to each device:

✅ **Auto-brightness** on all displays
✅ **2-3× battery life** for scouts
✅ **Whole-home light awareness** for AI
✅ **No internet/RTC** needed for day/night detection
✅ **Sunrise/sunset** automation
✅ **Anomaly detection** (lights at odd hours)
✅ **Professional** user experience

**Investment:** $11 for all 18 devices
**Value:** Immeasurable smart home intelligence

---

**Questions?** Check the [KVN_LDR Library README](../libraries/KVN_LDR/README.md)
