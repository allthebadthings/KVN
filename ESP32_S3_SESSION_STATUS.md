# ESP32-S3-Touch-LCD-3.5B MQTT Relay - Session Status

**Date:** 2024-12-09
**Device:** ESP32-S3-Touch-LCD-3.5B (Waveshare 3.5" 320×480 QSPI)
**Purpose:** MQTT Relay for KVN Smart Home System

## ✅ SOLVED: Display Working!

### Correct Pin Configuration (from Waveshare demo):
```cpp
#define LCD_QSPI_CS   12
#define LCD_QSPI_CLK  5
#define LCD_QSPI_D0   1
#define LCD_QSPI_D1   2
#define LCD_QSPI_D2   3
#define LCD_QSPI_D3   4
#define GFX_BL        6   // Backlight
```

### Critical: TCA9554 I/O Expander
- **Address:** 0x20
- **I2C Pins:** SDA=21, SCL=22
- **Function:** Controls display reset (pin 1)
- **Library:** TCA9554 (copied to Arduino/libraries)

### Display Configuration
```cpp
Arduino_DataBus* bus = new Arduino_ESP32QSPI(LCD_QSPI_CS, LCD_QSPI_CLK, LCD_QSPI_D0, LCD_QSPI_D1, LCD_QSPI_D2, LCD_QSPI_D3);
Arduino_GFX* gfx = new Arduino_AXS15231B(bus, -1, 1, false, 480, 320);
```
- **Driver:** AXS15231B
- **Rotation:** 1 (landscape mode)
- **Dimensions:** 480×320
- **Invert:** false

## 🔧 CURRENT ISSUE: Partition Table Error

### Error:
```
E (24) flash_parts: partition 3 invalid - offset 0x310000 size 0x300000 exceeds flash chip size 0x400000
E (25) boot: Failed to verify partition table
```

### Cause:
Board has 4MB flash but partition scheme tries to use more space.

### FIX:
**Arduino IDE → Tools → Partition Scheme:**
- Select: "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
- OR: "Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)"
- OR: "No OTA (2MB APP/2MB SPIFFS)"

## 📁 Files

### Working Code:
`/Users/kevin/KVN_Coordinator_System/examples/ESP32_S3_35_MQTT_Relay/ESP32_S3_35_MQTT_Relay.ino`

### Libraries Required:
- ✅ Arduino_GFX_Library (GFX Library for Arduino by moononournation)
- ✅ TCA9554 (copied from demo: `/Users/kevin/Downloads/ESP32-S3-Touch-LCD-3.5B-Demo/Arduino/libraries/TCA9554`)
- ✅ PubSubClient (MQTT)
- ✅ WiFi (built-in)
- ✅ Wire (built-in)

### Demo Code Location:
`/Users/kevin/Downloads/ESP32-S3-Touch-LCD-3.5B-Demo/`

## ⚙️ Board Configuration

**Board:** ESP32S3 Dev Module

**Settings:**
- Upload Speed: 115200
- USB CDC On Boot: Enabled
- Flash Size: 4MB ⚠️
- **Partition Scheme: Default 4MB with spiffs** ⚠️ CHANGE THIS
- PSRAM: OPI PSRAM (if available)
- CPU Frequency: 240MHz

## 🌐 Network Configuration

```cpp
WIFI_SSID: "guy-fi"
WIFI_PASSWORD: "244466666"
MQTT_BROKER: "192.168.86.38"
MQTT_PORT: 1883
MQTT_USER: "mqtt-ha"
MQTT_PASS: "dskjdfs98ewrkljh3"
```

**Device IP:** 192.168.86.39

## 📝 Current Code State

### Boot Sequence:
1. Initialize I2C (21, 22)
2. Reset display via TCA9554
3. Initialize display
4. Enable backlight (GPIO 6)
5. Flash RED → GREEN → BLUE (test colors)
6. Show boot screen with "KVN SYSTEM" / "MQTT Relay"
7. Connect WiFi
8. Connect MQTT

### Status Display:
**Currently DISABLED** (commented out in loop) for testing.

When enabled, shows:
- MQTT connection status
- Message count
- IP address
- Last MQTT message

## 🔍 Troubleshooting History

### Problems Solved:
1. ❌ **No display output** → Found correct QSPI pins in Waveshare demo
2. ❌ **Still no output** → Added TCA9554 library for display reset
3. ❌ **Display on side** → Changed to rotation 1 (landscape 480×320)
4. ❌ **Black screen** → Fixed Wire21.h typo to Wire.h

### Current Problem:
⚠️ **Partition table error** → Need to change partition scheme to 4MB

## 🚀 Next Steps

1. **IMMEDIATE:** Change partition scheme to "Default 4MB with spiffs"
2. Upload code again
3. Verify display shows RED/GREEN/BLUE flash and boot screen
4. Re-enable status display update in loop
5. Test MQTT message display
6. Add LDR sensor for auto-brightness (later)

## 📚 Resources

- [ESP32-S3-Touch-LCD-3.5B Wiki](https://www.waveshare.com/wiki/ESP32-S3-Touch-LCD-3.5B)
- [Waveshare Demo Code](file:///Users/kevin/Downloads/ESP32-S3-Touch-LCD-3.5B-Demo/)
- [Arduino_GFX Library](https://github.com/moononournation/Arduino_GFX)

---

**Status:** Ready to upload after fixing partition scheme
**Last Updated:** 2024-12-09 06:20 AM
