# ESP32-S3 Watchtower with LDR Integration

Per-room environmental monitoring with auto-brightness and occupancy detection.

## Features

✅ **Auto-brightness** - Display backlight adjusts to room lighting
✅ **Room light tracking** - Per-room lux monitoring
✅ **Occupancy hints** - Detects when lights turn on/off
✅ **Window detection** - Distinguish window rooms from interior
✅ **Home Assistant integration** - Auto-discovery support
✅ **Low power** - Smart brightness = energy savings

## Hardware Requirements

- **ESP32-S3 Watchtower board**
- **1× 5528 LDR** (light-dependent resistor)
- **1× 10kΩ resistor** (1/4W)
- **OLED/LCD display** with backlight control
- **WiFi connection**
- **MQTT broker** (Home Assistant)

## Wiring

```
ESP32-S3
┌──────────┐
│ 3.3V     │──┐
│          │  │  ┌────────┐
│ GPIO 1   │◄─┼──┤  LDR   │
│          │  │  └────────┘
│ GND      │  │      ↓
│          │  │   ┌──┴──┐
│ GPIO 10  │──┼───│ 10k │ (Backlight)
└──────────┘  │   └──┬──┘
              └──────┘
```

**Pin Assignment:**
- **GPIO 1** - LDR analog input (ADC)
- **GPIO 10** - Display backlight PWM
- **3.3V** - LDR power supply
- **GND** - Ground reference

## Installation

### 1. Install Libraries

Via Arduino Library Manager:
- **KVN_LDR** (copy from `/libraries/KVN_LDR/`)
- **PubSubClient** (MQTT client)

```bash
cp -r ../../libraries/KVN_LDR ~/Documents/Arduino/libraries/
```

### 2. Configure Node Number

**IMPORTANT:** Each Watchtower must have a unique node number!

Edit the firmware:

```cpp
#define NODE_NUMBER 1  // 1-10 for different rooms
```

Assign rooms:
- Node 1 = Living Room
- Node 2 = Bedroom
- Node 3 = Kitchen
- Node 4 = Office
- Node 5 = Bathroom
- Node 6 = Hallway
- Node 7 = Garage
- Node 8 = Basement
- Node 9 = Attic
- Node 10 = Guest Room

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

**Tools → Board → ESP32 Arduino → ESP32S3 Dev Module**

### 5. Upload to Each Device

Upload firmware to all 10 Watchtower nodes, changing `NODE_NUMBER` each time.

## Usage

### MQTT Topics Published

```
homeassistant/sensor/esp32_s3_node1/lux              → Lux value: 156
homeassistant/sensor/esp32_s3_node1/ambient_light    → Full JSON
homeassistant/sensor/esp32_s3_node1/status           → Device status
vanguard/s3/Living Room/event                        → Room events
```

### MQTT Events

```
lights_on     → Room lights just turned on (occupancy likely)
lights_off    → Room lights just turned off (room vacated)
```

### Serial Output

```
=== ESP32-S3 Watchtower Node 1 ===
Room: Living Room

LDR initialized on GPIO 1
Display backlight on GPIO 10
Connecting to WiFi... Connected!
IP: 192.168.86.51
Connecting to MQTT... connected!
Published Home Assistant discovery

Watchtower ready!
Monitoring Living Room light levels

[Living Room] LDR: Raw=2847 | Lux=156 | Level=NORMAL | Brightness=178/255 | Day=YES
[Living Room] Published: {"raw":2847,"lux":156,"level":2,"is_day":true}

[Living Room] Room lights activated
[Living Room] Room lights deactivated
Duration: 45 minutes
```

## Features in Detail

### 1. Auto-Brightness

Display backlight automatically adjusts to room lighting:

```cpp
uint8_t brightness = roomLight.getBrightness(20, 255, true);
analogWrite(S3_DISPLAY_BL, brightness);
```

- **Dark room** → Backlight dims to 20/255 (8%)
- **Bright room** → Backlight increases to 255/255 (100%)
- **Gamma correction** → Smooth perceived brightness curve

### 2. Occupancy Detection

Correlates light changes with room usage:

```cpp
if (isLightOn && !wasLightOn) {
    // Light just turned on
    mqtt.publish("vanguard/s3/Living Room/event", "lights_on");
    // Interpretation: Someone entered the room
}
```

**Use cases:**
- Trigger room-specific automations
- Track room usage patterns
- Energy usage correlation
- Security (unexpected lights)

### 3. Window vs. Interior Detection

Window rooms have different light patterns:

**Window Room:**
- Gradual sunrise/sunset changes
- Higher daytime lux (100-1000+)
- Weather-dependent variations

**Interior Room:**
- Abrupt on/off transitions
- Lower ambient light (0-50 lux)
- Artificial light only

This helps AI understand home layout.

### 4. Home Assistant Auto-Discovery

Automatically creates sensors in Home Assistant:

```yaml
sensor.living_room_light
sensor.bedroom_light
sensor.kitchen_light
# ... all 10 rooms
```

No manual configuration needed!

## Customization

### Adjust Room Names

Edit the `ROOM_NAMES[]` array:

```cpp
const char* ROOM_NAMES[] = {
    "Unknown",
    "Your Room 1",  // Node 1
    "Your Room 2",  // Node 2
    // ... customize for your home
};
```

### Adjust Occupancy Threshold

Change the light detection threshold:

```cpp
const uint16_t LIGHT_ON_THRESHOLD = 100; // lux

// Lower for dim rooms (bathrooms)
const uint16_t LIGHT_ON_THRESHOLD = 50;

// Higher for bright rooms (kitchens)
const uint16_t LIGHT_ON_THRESHOLD = 150;
```

### Adjust Backlight Range

Change min/max brightness:

```cpp
// Dimmer night mode
uint8_t brightness = roomLight.getBrightness(10, 200, true);

// Always-on minimum
uint8_t brightness = roomLight.getBrightness(50, 255, true);
```

## Troubleshooting

### Display Too Bright at Night

Lower minimum brightness:

```cpp
uint8_t brightness = roomLight.getBrightness(10, 255, true);
//                                            ^^ reduce this
```

### Display Too Dim in Daylight

Increase maximum brightness:

```cpp
uint8_t brightness = roomLight.getBrightness(20, 255, true);
//                                                ^^ already max
```

Check if display backlight pin supports full 255 PWM.

### Occupancy Detection Too Sensitive

Increase threshold:

```cpp
const uint16_t LIGHT_ON_THRESHOLD = 150; // was 100
```

### Erratic Brightness Changes

Solutions:
- Use `readSmoothed()` (already implemented)
- Increase `hasChanged()` threshold to 200 or 300
- Add capacitor (0.1µF) between GPIO 1 and GND

## Home Assistant Integration

### Sensor Entities

After auto-discovery, entities appear as:

```yaml
sensor:
  - entity_id: sensor.living_room_light
    state: 156
    unit_of_measurement: lx
    device_class: illuminance

  - entity_id: sensor.bedroom_light
    state: 12
    unit_of_measurement: lx
    device_class: illuminance

  # ... all 10 rooms
```

### Automation Examples

**Turn on lights when room is dark:**

```yaml
automation:
  - alias: "Living Room Auto Light"
    trigger:
      - platform: numeric_state
        entity_id: sensor.living_room_light
        below: 50
    condition:
      - condition: time
        after: "17:00:00"
    action:
      - service: light.turn_on
        target:
          entity_id: light.living_room
```

**Occupancy correlation:**

```yaml
automation:
  - alias: "Bedroom Occupied"
    trigger:
      - platform: mqtt
        topic: "vanguard/s3/Bedroom/event"
        payload: "lights_on"
    action:
      - service: climate.set_temperature
        target:
          entity_id: climate.bedroom
        data:
          temperature: 21
```

### Dashboard Card

**Multi-room light levels:**

```yaml
type: custom:mini-graph-card
entities:
  - sensor.living_room_light
  - sensor.bedroom_light
  - sensor.kitchen_light
name: Room Light Levels
hours_to_show: 24
line_width: 2
points_per_hour: 4
```

**Gauge for single room:**

```yaml
type: gauge
entity: sensor.living_room_light
name: Living Room Light
min: 0
max: 500
severity:
  green: 0
  yellow: 50
  red: 200
```

## Deployment Checklist

For each of the 10 Watchtower nodes:

- [ ] Change `NODE_NUMBER` (1-10)
- [ ] Verify room name in `ROOM_NAMES[]`
- [ ] Solder LDR + 10kΩ resistor to GPIO 1
- [ ] Connect display backlight to GPIO 10
- [ ] Upload firmware
- [ ] Verify Serial Monitor output
- [ ] Check Home Assistant auto-discovery
- [ ] Label device with room name
- [ ] Install in target room

## Next Steps

1. **Deploy to first S3 Watchtower** - Test in one room
2. **Verify Home Assistant** - Check sensor appears
3. **Deploy to remaining 9 nodes** - Change NODE_NUMBER each time
4. **Build automations** - Use room light data for smart control
5. **Add to other devices** - Integrate LDR on C3 Scouts

## Documentation

- [LDR Library Reference](../../libraries/KVN_LDR/README.md)
- [System-wide Integration Guide](../../docs/LDR_SYSTEM_INTEGRATION.md)
- [KVN System Overview](../../README.md)
