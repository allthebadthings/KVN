3# ESP32-C3 Scout with LDR Integration

Ultra-low-power battery-powered motion sensor with intelligent day/night operation.

## Features

✅ **2-3× battery life extension** - Deep sleep during daylight
✅ **Smart power management** - Active only at night
✅ **Motion detection** - PIR sensor integration
✅ **Window monitoring** - Curtain/blind state detection
✅ **Hallway automation** - Night-light triggers
✅ **MQTT reporting** - Status updates to Home Assistant

## Hardware Requirements

- **ESP32-C3 Scout board** (low-power variant recommended)
- **1× 5528 LDR** (light-dependent resistor)
- **1× 10kΩ resistor** (1/4W)
- **1× PIR motion sensor** (HC-SR501 or similar)
- **1× Temperature/Humidity sensor** (DHT22, DHT11, or similar - 3-pin: +/OUT/-)
- **1× Microphone/Sound sensor** (4-pin: AO/G/+/DO)
- **Battery** (1000-2000mAh LiPo recommended)
- **WiFi connection**
- **MQTT broker** (Home Assistant)

## Wiring

```
ESP32-C3
┌──────────┐
│ 3.3V     │──┐
│          │  │  ┌────────┐    ┌──────────┐    ┌──────────┐
│ GPIO 0   │◄─┼──┤  LDR   │    │ DHT22    │    │ MIC      │
│          │  │  └────────┘    │ Temp/Hum │    │ Sound    │
│ GND      │  │      ↓          │ Sensor   │    │ Sensor   │
│          │  │   ┌──┴──┐      └──────────┘    └──────────┘
│ GPIO 2   │──┼───│ 10k │         ┌─────────┐
│          │  │   └──┬──┘         │ PIR     │
│ GPIO 3   │──┼────────────────── │ Sensor  │
│          │  │                   └─────────┘
│ GPIO 4   │──┼────────────────── DHT22 (OUT)
│          │  │
│ GPIO 5   │──┼────────────────── MIC (AO - Analog Out)
│          │  │
│ GPIO 6   │──┼────────────────── MIC (DO - Digital Out)
│          │  │
│ GPIO 8   │  └────────────────── Status LED
└──────────┘
```

**Pin Assignment:**
- **GPIO 0** - LDR analog input (ADC1_CH0)
- **GPIO 2** - PIR motion sensor digital input
- **GPIO 3** - Reserved/Alternative PIR input
- **GPIO 4** - DHT22 Temperature/Humidity data pin (OUT)
- **GPIO 5** - Microphone analog output (AO - for sound level)
- **GPIO 6** - Microphone digital output (DO - for sound detection)
- **GPIO 8** - Status LED (built-in on many C3 boards)
- **3.3V** - Power for all sensors (LDR, PIR, DHT22, MIC)
- **GND** - Ground reference for all sensors

**Sensor Pinouts:**
- **DHT22** (3-pin): `+` (VCC) → 3.3V, `OUT` (Data) → GPIO 4, `-` (GND) → GND
- **Microphone** (4-pin): `+` (VCC) → 3.3V, `G` (GND) → GND, `AO` (Analog) → GPIO 5, `DO` (Digital) → GPIO 6

## Installation

### 1. Install Libraries

Via Arduino Library Manager:
- **KVN_LDR** (copy from `/libraries/KVN_LDR/`)
- **PubSubClient** (MQTT client)

```bash
cp -r ../../libraries/KVN_LDR ~/Documents/Arduino/libraries/
```

### 2. Configure Scout Number

**IMPORTANT:** Each Scout must have a unique number!

Edit the firmware:

```cpp
#define SCOUT_NUMBER 1  // 1-6 for different locations
```

Assign locations:
- Scout 1 = Front Door
- Scout 2 = Back Door
- Scout 3 = Living Window
- Scout 4 = Bedroom Window
- Scout 5 = Garage
- Scout 6 = Basement Stairs

### 3. Configure WiFi and MQTT

Edit `../secrets.h`:

```cpp
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"
#define MQTT_BROKER "192.168.86.38"
#define MQTT_PORT 1883
#define MQTT_USER "mqtt-ha"
#define MQTT_PASS "your-mqtt-password"
```

### 4. Select Board

**Tools → Board → ESP32 Arduino → ESP32C3 Dev Module**

**Tools → Flash Mode → DIO** (for low power)

### 5. Upload to Each Device

Upload firmware to all 6 Scout nodes, changing `SCOUT_NUMBER` each time.

## Usage

### Power Management

The Scout operates in two modes:

**DAYTIME (☀️):**
- Detects ambient light > 1500 ADC units
- Enters deep sleep for 1 hour
- Wakes up, checks light, sleeps again
- Current draw: ~10µA (ultra-low power)

**NIGHTTIME (🌙):**
- Detects ambient light < 1500 ADC units
- Active motion detection for 5 minutes
- Publishes motion events via MQTT
- Sleeps for 5 minutes, repeats
- Current draw: ~35mA average (with sleep cycles)

### MQTT Topics Published

```
homeassistant/sensor/esp32_c3_scout1/lux              → Lux value
homeassistant/sensor/esp32_c3_scout1/ambient_light    → Full JSON
vanguard/scout/Front Door/status                      → Device status
vanguard/scout/Front Door/motion                      → Motion events
vanguard/scout/Front Door/window_status               → Curtain state
```

### Serial Output

```
=== ESP32-C3 Scout 1 ===
Location: Front Door
Boot #1

Current light: 2847 lux
☀️ Daytime detected - sleeping for 1 hour
Power saving mode active

[Wakes up after 1 hour]

=== ESP32-C3 Scout 1 ===
Location: Front Door
Boot #2

Current light: 45 lux
🌙 Nighttime - motion detection active
Connecting to WiFi... Connected!
IP: 192.168.86.55
MQTT connected

Monitoring for motion...

🚨 Motion detected!
[Front Door] Published: {"raw":1234,"lux":45,"level":1,"is_day":false}

Night cycle complete - sleeping for 5 minutes
```

## Battery Life

### Without LDR (24/7 Active)

- **Current draw:** 80mA
- **Battery:** 1000mAh
- **Runtime:** ~12.5 hours

### With LDR (Smart Sleep)

- **Daytime (12h):** Deep sleep @ 10µA
- **Nighttime (12h):** Active + sleep cycles @ 80mA avg
- **Average current:** ~35mA
- **Battery:** 1000mAh
- **Runtime:** ~28 hours (**2.2× longer!**)

### With 2000mAh Battery

- **Runtime:** ~56 hours (~2.3 days)

### Battery Recommendations

| Battery | Capacity | Runtime | Use Case |
|---------|----------|---------|----------|
| Small LiPo | 500mAh | ~14 hours | Testing only |
| Standard LiPo | 1000mAh | ~28 hours | Daily charging |
| Large LiPo | 2000mAh | ~56 hours | 2-3 day operation |
| USB Power Bank | 5000mAh+ | 1+ week | Semi-permanent install |

## Features in Detail

### 1. Intelligent Sleep Scheduling

```cpp
if (scoutLight.isDay(DAY_THRESHOLD)) {
    // Sleep for 1 hour
    esp_sleep_enable_timer_wakeup(3600 * 1000000ULL);
    esp_deep_sleep_start();
} else {
    // Active motion detection
    // Sleep for 5 minutes between checks
}
```

### 2. Motion Detection

PIR sensor triggers MQTT event:

```cpp
if (motionDetected) {
    mqtt.publish("vanguard/scout/Front Door/motion", "detected");
    // Flash LED for visual confirmation
}
```

### 3. Window Curtain Detection

Detects curtain/blind state (for window-mounted scouts):

```cpp
if (lux > 500) {
    mqtt.publish(topic, "curtains_open");
} else if (lux < 50 && scoutLight.isDay()) {
    mqtt.publish(topic, "curtains_closed");
}
```

**Use cases:**
- Detect if curtains left open overnight
- Security alerts (unexpected curtain opening)
- Energy optimization (close curtains to retain heat)

### 4. Boot Counter

Tracks device uptime and resets:

```cpp
RTC_DATA_ATTR int bootCount = 0;

void setup() {
    bootCount++;
    Serial.println("Boot #" + String(bootCount));
}
```

Stored in RTC memory - survives deep sleep but resets on power loss.

## Deployment Scenarios

### Scenario 1: Motion Security (Front/Back Door)

- **Location:** Entry points
- **Goal:** Detect motion at night
- **Config:** Standard settings
- **Battery:** 2000mAh (2-3 days)

### Scenario 2: Window Monitoring

- **Location:** Window sills
- **Goal:** Curtain state + light levels
- **Config:** Enable curtain detection
- **Battery:** 1000mAh (daily charge via solar?)

### Scenario 3: Hallway Night-Light

- **Location:** Hallways/stairs
- **Goal:** Trigger night-lights on motion
- **Config:** Fast MQTT publish, low threshold
- **Battery:** USB power bank (always-on)

## Customization

### Adjust Sleep Durations

```cpp
#define SLEEP_DURATION_DAY   7200  // 2 hours (was 1 hour)
#define SLEEP_DURATION_NIGHT  600  // 10 minutes (was 5 minutes)
```

Longer sleep = better battery life, less frequent updates.

### Adjust Day/Night Threshold

```cpp
#define DAY_THRESHOLD 1000  // Lower threshold (was 1500)
```

- **Lower value** → Stays active longer into twilight
- **Higher value** → Sleeps earlier in evening

### Disable Daytime Updates

To maximize battery life, comment out daytime MQTT:

```cpp
if (isDay) {
    // if (connectQuick()) {
    //     publishLightData();
    //     mqtt.disconnect();
    // }

    esp_sleep_enable_timer_wakeup(SLEEP_DURATION_DAY * 1000000ULL);
    esp_deep_sleep_start();
}
```

This eliminates WiFi wakeups during daytime.

## Troubleshooting

### Device Never Wakes Up

- Check battery voltage (should be > 3.3V)
- Verify deep sleep timer is set correctly
- Press RESET button to force wake

### Motion Not Detected

- Check PIR sensor wiring (VCC, GND, OUT to GPIO 2)
- Adjust PIR sensitivity potentiometer
- Verify sensor has warmed up (30-60 seconds)

### Battery Drains Too Fast

Solutions:
- Increase sleep durations
- Disable daytime MQTT updates
- Use larger battery
- Reduce WiFi connection attempts (edit `connectWiFi()`)

### Stuck in Sleep Mode

If Scout is sleeping during night:
- Reset device manually
- Check LDR calibration (may be reading too bright)
- Lower `DAY_THRESHOLD` value

## Home Assistant Integration

### Binary Sensor for Motion

```yaml
binary_sensor:
  - platform: mqtt
    name: "Front Door Motion"
    state_topic: "vanguard/scout/Front Door/motion"
    payload_on: "detected"
    device_class: motion
```

### Automation Examples

**Turn on lights when motion detected:**

```yaml
automation:
  - alias: "Front Door Motion Light"
    trigger:
      - platform: mqtt
        topic: "vanguard/scout/Front Door/motion"
        payload: "detected"
    condition:
      - condition: sun
        after: sunset
    action:
      - service: light.turn_on
        target:
          entity_id: light.front_porch
```

**Alert on unexpected curtains:**

```yaml
automation:
  - alias: "Curtain Security Alert"
    trigger:
      - platform: mqtt
        topic: "vanguard/scout/Bedroom Window/window_status"
        payload: "curtains_open"
    condition:
      - condition: time
        after: "22:00:00"
        before: "06:00:00"
    action:
      - service: notify.mobile_app
        data:
          message: "Bedroom curtains opened at night!"
```

## Deployment Checklist

For each of the 6 Scout nodes:

- [ ] Change `SCOUT_NUMBER` (1-6)
- [ ] Verify location name in `SCOUT_LOCATIONS[]`
- [ ] Solder LDR + 10kΩ resistor to GPIO 0
- [ ] Connect PIR sensor to GPIO 2
- [ ] Connect battery (1000-2000mAh)
- [ ] Upload firmware
- [ ] Verify Serial Monitor shows sleep cycles
- [ ] Test motion detection
- [ ] Check Home Assistant sensors appear
- [ ] Label device with location name
- [ ] Install in target location

## Power Optimization Tips

1. **Use ESP32-C3 SuperMini** - Smaller, more efficient
2. **Solar charging** - Add small solar panel for window scouts
3. **Increase sleep durations** - Trade update frequency for battery life
4. **Disable status LED** - Comment out LED code to save ~5mA
5. **Use static IP** - Faster WiFi connection = less power
6. **Reduce WiFi TX power** - Add `WiFi.setTxPower(WIFI_POWER_MINUS_1dBm)`

## Next Steps

1. **Deploy to first C3 Scout** - Test power management
2. **Monitor battery life** - Track actual runtime
3. **Optimize sleep timings** - Adjust based on usage patterns
4. **Add to remaining 5 scouts** - Change SCOUT_NUMBER each time
5. **Build automations** - Use motion + light data

## Documentation

- [LDR Library Reference](../../libraries/KVN_LDR/README.md)
- [System-wide Integration Guide](../../docs/LDR_SYSTEM_INTEGRATION.md)
- [KVN System Overview](../../README.md)

## Battery Life Calculation Example

```
Daytime (12 hours):
  Deep sleep: 12h × 0.01mA = 0.12mAh

Nighttime (12 hours):
  - Active (5 min cycles): 2.4h × 80mA = 192mAh
  - Sleep (5 min cycles): 9.6h × 0.01mA = 0.096mAh
  Total: ~192mAh

Daily consumption: 0.12 + 192 = ~192mAh
1000mAh battery: ~5.2 days runtime

2000mAh battery: ~10.4 days runtime
```

**Note:** Actual runtime varies based on WiFi signal strength, MQTT traffic, and temperature.
