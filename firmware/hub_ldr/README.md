# ESP32-P4 Hub with LDR Integration

Master controller with ambient light sensing for intelligent home automation.

## Features

✅ **System-wide day/night detection** - Coordinates all 17 KVN devices
✅ **Sunrise/sunset automation** - No internet or RTC required
✅ **AI context enhancement** - Provides lighting conditions to AI
✅ **Security mode** - Detects when all rooms are dark
✅ **MQTT publishing** - Shares light data with Home Assistant

## Hardware Requirements

- **ESP32-P4 Hub board**
- **1× 5528 LDR** (light-dependent resistor)
- **1× 10kΩ resistor** (1/4W)
- **WiFi connection**
- **MQTT broker** (Home Assistant)

## Wiring

```
ESP32-P4 Hub
┌──────────┐
│ 3.3V     │──┐
│          │  │  ┌────────┐
│ GPIO 1   │◄─┼──┤  LDR   │
│          │  │  └────────┘
│ GND      │  │      ↓
└──────────┘  │   ┌──┴──┐
              │   │ 10k │
              │   └──┬──┘
              └──────┘
```

**Pin Assignment:**
- **GPIO 1** - LDR analog input (ADC)
- **3.3V** - LDR power supply
- **GND** - Ground reference

## Installation

### 1. Install Libraries

Via Arduino Library Manager:
- **KVN_LDR** (copy from `/libraries/KVN_LDR/`)
- **PubSubClient** (MQTT client)

Or copy directly:
```bash
cp -r ../../libraries/KVN_LDR ~/Documents/Arduino/libraries/
```

### 2. Configure WiFi and MQTT

Edit `../secrets.h`:

```cpp
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"
#define MQTT_BROKER "192.168.86.38"
#define MQTT_PORT 1883
#define MQTT_USER "mqtt-ha"
#define MQTT_PASS "your-mqtt-password"
```

### 3. Select Board

**Tools → Board → ESP32 Arduino → ESP32P4 Dev Module**

(Board selection may vary based on your P4 variant)

### 4. Upload

Click **Upload** in Arduino IDE

## Usage

### MQTT Topics Published

```
vanguard/hub/ambient_light    → Full JSON: {"raw":2847,"lux":156,"level":2,"is_day":true}
vanguard/hub/lux              → Lux value: 156
vanguard/hub/day_mode         → Boolean: true/false
vanguard/system/mode          → System mode: night_security
vanguard/system/event         → Events: sunrise, sunset
vanguard/ai/context/light     → AI context string
```

### MQTT Topics Subscribed

```
vanguard/+/ambient_light      → Light data from all devices
homeassistant/sensor/+/lux    → Lux values from sensors
```

### Serial Output

```
=== ESP32-P4 Hub with LDR Integration ===

LDR initialized on GPIO 1
Connecting to WiFi... Connected!
IP: 192.168.86.45
Connecting to MQTT... connected!

Hub ready!
Publishing master light level to MQTT

LDR: Raw=2847 | Lux=156 | Level=NORMAL | Brightness=178/255 | Day=YES
Published: {"raw":2847,"lux":156,"level":2,"is_day":true}

☀️ Sunrise detected!
🌙 Sunset detected!
```

## Features in Detail

### 1. Day/Night Detection

Automatically detects ambient light transitions:

```cpp
bool isDay = hubLight.isDay(1500);  // Threshold: 1500 ADC units

if (wasDay && !isDay) {
    // Sunset - enable night mode
}

if (!wasDay && isDay) {
    // Sunrise - disable night mode
}
```

### 2. System-wide Security Mode

Monitors all room light levels. When ALL rooms are dark:

```cpp
if (allRoomsDark() && hubLight.getLux() < 50) {
    mqtt.publish("vanguard/system/mode", "night_security");

    // Actions:
    // - Arm motion sensors
    // - Enable camera recording
    // - Disable notification sounds
}
```

### 3. AI Context

Provides natural language context to AI systems:

```
"Hub ambient light: 156 lux. Daytime conditions. Normal lighting."
```

This helps AI make smarter automation decisions.

### 4. Sunrise/Sunset Events

Publishes events when light transitions occur:

```yaml
# Home Assistant Automation
automation:
  - alias: "Morning Routine"
    trigger:
      - platform: mqtt
        topic: "vanguard/system/event"
        payload: "sunrise"
    action:
      - service: scene.turn_on
        target:
          entity_id: scene.morning
```

## Calibration

### Option 1: Auto-Calibration

Uncomment in `setup()`:

```cpp
hubLight.autoCalibrate();
```

Follow Serial Monitor prompts to measure dark and bright values.

### Option 2: Manual Calibration

If you know your ADC range:

```cpp
hubLight.setCalibration(600, 3200);  // Your measured min/max
```

## Troubleshooting

### No MQTT Connection

Check:
- MQTT broker IP and credentials in `secrets.h`
- WiFi connection status
- MQTT broker is running (Home Assistant Add-on)

### LDR Always Shows Same Value

Check:
- GPIO 1 is ADC-capable on your P4 variant
- LDR wiring: 3.3V → LDR → GPIO 1 → 10kΩ → GND
- `hubLight.begin()` is called in `setup()`

### Erratic Light Readings

Solutions:
- Use `readSmoothed()` instead of `readRaw()`
- Add 0.1µF capacitor between GPIO 1 and GND
- Shield LDR from direct LED backlight

## Integration with Home Assistant

### Sensor Configuration

```yaml
sensor:
  - platform: mqtt
    name: "Hub Light Level"
    state_topic: "vanguard/hub/lux"
    unit_of_measurement: "lx"
    device_class: illuminance

binary_sensor:
  - platform: mqtt
    name: "Hub Day Mode"
    state_topic: "vanguard/hub/day_mode"
    payload_on: "true"
    payload_off: "false"
```

### Dashboard Card

```yaml
type: gauge
entity: sensor.hub_light_level
name: Hub Ambient Light
min: 0
max: 1000
severity:
  green: 50
  yellow: 200
  red: 500
```

## Next Steps

1. **Deploy to P4 Hub** - Upload firmware to hardware
2. **Verify MQTT** - Check Home Assistant receives data
3. **Add to other devices** - Integrate LDR on S3 Watchtowers and C3 Scouts
4. **Build automations** - Create day/night routines in Home Assistant

## Documentation

- [LDR Library Reference](../../libraries/KVN_LDR/README.md)
- [System-wide Integration Guide](../../docs/LDR_SYSTEM_INTEGRATION.md)
- [KVN System Overview](../../README.md)
