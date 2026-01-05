# ESP32-2432S028R MQTT Relay (Cheap Yellow Display)

Dedicated MQTT relay for KVN Coordinator System using the popular ESP32-2432S028R board.

## Features

✅ **2.8" ILI9341 Display** - 240x320 color TFT (portrait mode)
✅ **Built-in LDR** - Auto-brightness on GPIO 34
✅ **RGB LED Status** - Visual feedback (R:4, G:16, B:17)
✅ **Touch Screen** - XPT2046 resistive touch (future use)
✅ **MQTT Relay** - Bridge between KVN devices and Home Assistant
✅ **Real-time Monitoring** - Message count, status, light levels

## Hardware Specifications

### ESP32-2432S028R Board

- **MCU:** ESP32-WROOM-32 (Dual-core @ 240MHz)
- **Display:** 2.8" ILI9341 (240×320 pixels)
- **Touch:** XPT2046 resistive touch controller
- **LDR:** Built-in light sensor (GPIO 34)
- **RGB LED:** Built-in (Active LOW)
- **Speaker:** Built-in amplifier (GPIO 26)
- **SD Card:** MicroSD slot
- **USB:** Micro-USB (or USB-C on rev 3)

### Pin Mapping

| Component | Pin(s) | Notes |
|-----------|--------|-------|
| **Display (HSPI)** | | |
| SCK | 14 | SPI clock |
| MOSI | 13 | SPI data |
| MISO | 12 | SPI read |
| CS | 15 | Chip select |
| DC | 2 | Data/command |
| Backlight | 21 | PWM control |
| **LDR** | 34 | ADC1_CH6 (input-only) |
| **RGB LED** | 4, 16, 17 | Red, Green, Blue (active LOW) |
| **Touch** | 25, 32, 33, 36, 39 | XPT2046 controller |
| **SD Card** | 5, 18, 19, 23 | MicroSD slot |

## Installation

### 1. Install Libraries

**Via Arduino Library Manager:**
- **LovyanGFX** by lovyan03
- **PubSubClient** by Nick O'Leary
- **KVN_LDR** (copy from repository)

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

**Tools → Board → ESP32 Arduino → ESP32 Dev Module**

**Other Settings:**
- Upload Speed: 4xxxxxxx
- CPU Frequency: 240MHz (WiFi/BT)
- Flash Frequency: 40MHz
- Flash Mode: QIO
- Flash Size: 4MB (32Mb)
- Partition Scheme: Default 4MB with spiffs

### 4. Upload

Click **Upload** in Arduino IDE

## Usage

### Display Screens

**Status Screen (Default):**
- System status (ONLINE/WIFI ONLY/OFFLINE)
- Message count
- IP address
- Current light level (lux)
- Last MQTT message received
- Time since last message

### RGB LED Status

| Color | Meaning |
|-------|---------|
| Blue | Booting |
| Green | Connected and ready |
| Yellow | Connecting to MQTT |
| Red | Error (WiFi or MQTT failure) |
| Cyan (flash) | Message received |
| Off | Powered down |

### Auto-Brightness

The built-in LDR on GPIO 34 automatically adjusts display brightness:

- **Dark room** → Backlight dims to 30/255 (12%)
- **Bright room** → Backlight increases to 255/255 (100%)
- **Gamma correction** → Smooth perceived brightness

### Serial Output

```
=== ESP32-2432S028R MQTT Relay ===
Cheap Yellow Display (CYD)

LDR initialized on GPIO 34
Connecting to WiFi... Connected!
IP: 192.168.86.50

Relay ready!

MQTT [homeassistant/sensor/esp32_s3_node1/lux]: 156
MQTT [vanguard/hub/day_mode]: true
MQTT [vanguard/scout/Front Door/motion]: detected
```

## MQTT Topics

### Subscribed Topics

```
homeassistant/sensor/+/+    → All Home Assistant sensors
vanguard/control/+/+        → KVN control commands
vanguard/ai/+               → AI integration messages
```

### Published Topics

```
vanguard/relay/status       → Relay online/offline status
```

## Troubleshooting

### Display Shows Nothing

Check:
- Power supply is adequate (5V 1A minimum)
- USB cable is data-capable (not charge-only)
- Board selection is correct (ESP32 Dev Module)

### Display is Inverted or Wrong Colors

Edit the LGFX configuration:

```cpp
cfg.invert = true;    // Try toggling this
cfg.rgb_order = true; // Try toggling this
```

### LDR Not Working

The LDR is built-in on GPIO 34 (ADC1_CH6). Verify:
- GPIO 34 is input-only (correct)
- `ldr.begin()` is called in setup
- Check Serial Monitor for lux readings

### RGB LED Not Working

LEDs are **active LOW**:

```cpp
digitalWrite(RGB_LED_R, LOW);  // Turn ON red LED
digitalWrite(RGB_LED_R, HIGH); // Turn OFF red LED
```

### MQTT Not Connecting

Check:
- MQTT broker IP and port in `secrets.h`
- Home Assistant MQTT add-on is running
- Credentials are correct
- WiFi is connected (check Serial Monitor)

## Comparison to ESP32-C6-LCD-1.47

| Feature | ESP32-2432S028R (CYD) | ESP32-C6-LCD-1.47 |
|---------|----------------------|-------------------|
| **MCU** | ESP32-WROOM-32 | ESP32-C6 RISC-V |
| **Display** | 2.8" (240×320) | 1.47" (172×320) |
| **Controller** | ILI9341 | ST7789 |
| **LDR** | Built-in (GPIO 34) | External required |
| **RGB LED** | Built-in | No |
| **Touch** | Resistive | No |
| **Price** | ~$12 | ~$8 |
| **Size** | Larger | Compact |

**Advantages of CYD:**
- Bigger display (easier to read)
- Built-in LDR (no soldering)
- RGB LED for status
- Touch screen
- More mature/popular board

## Home Assistant Integration

### Device Discovery

Relay automatically publishes status to:

```
vanguard/relay/status → "online"
```

### Automation Example

```yaml
automation:
  - alias: "Relay Offline Alert"
    trigger:
      - platform: mqtt
        topic: "vanguard/relay/status"
        payload: "offline"
    action:
      - service: notify.mobile_app
        data:
          message: "MQTT Relay went offline!"
```

## Future Enhancements

- [ ] Touch screen interface (switch between screens)
- [ ] Message log screen (last 10 messages)
- [ ] Network statistics screen
- [ ] Graph of message traffic
- [ ] SD card logging
- [ ] Speaker alerts on critical messages
- [ ] Web server for configuration

## Documentation

- [KVN System Overview](../../README.md)
- [LDR Library Reference](../../libraries/KVN_LDR/README.md)
- [System-wide LDR Integration](../../docs/LDR_SYSTEM_INTEGRATION.md)

## External Resources

- [Random Nerd Tutorials - ESP32 CYD Pinout](https://randomnerdtutorials.com/esp32-cheap-yellow-display-cyd-pinout-esp32-2432s028r/)
- [Kafkar Projects - CYD Connectors](https://kafkar.com/projects/smart-home/understanding-connectors-and-pinout-cheap-yellow-display-boardcyd-esp32-2432s028r/)
