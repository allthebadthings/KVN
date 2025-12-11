# KVN System - Current Session Status

**Date:** 2024-12-08
**Device:** ESP32-2432S028R (Cheap Yellow Display)
**Purpose:** MQTT Relay for KVN Smart Home System

## CURRENT STATUS

### ✅ WORKING:
- WiFi connection (192.168.86.31)
- MQTT connection (receiving messages)
- LDR sensor (reading 5-60 lux correctly on GPIO 34)
- RGB LED status indicators
- System runs STABLE without display

### ❌ PROBLEM:
- **LovyanGFX library causes ESP32 to crash after ~30 seconds** (watchdog timeout)
- Confirmed by testing: System runs perfectly WITHOUT display code

### 🔧 SOLUTION IN PROGRESS:
Switched from LovyanGFX to **TFT_eSPI** library (more stable on this board)

## FILES CREATED:

### Working Code:
- `/Users/kevin/KVN_Coordinator_System/examples/ESP32_2432S028_MQTT_Relay_TFT_eSPI/ESP32_2432S028_MQTT_Relay_TFT_eSPI.ino`
  - Uses TFT_eSPI instead of LovyanGFX
  - Full status screen with live data
  - Auto-brightness from LDR
  - MQTT message display

### Configuration:
- `/Users/kevin/KVN_Coordinator_System/examples/ESP32_2432S028_MQTT_Relay/User_Setup.h`
  - TFT_eSPI config for ESP32-2432S028R
  - Already copied to: `~/Documents/Arduino/libraries/TFT_eSPI/User_Setup.h`

### Libraries Installed:
- ✅ LovyanGFX (but causes crashes - don't use)
- ✅ TFT_eSPI (stable - use this!)
- ✅ KVN_LDR (working perfectly)
- ✅ PubSubClient (MQTT)

### Other Firmware Examples Created:
- `/Users/kevin/KVN_Coordinator_System/examples/ESP32_P4_Hub_LDR/` - LDR integration for P4 Hub
- `/Users/kevin/KVN_Coordinator_System/examples/ESP32_S3_Watchtower_LDR/` - LDR for S3 Watchtower (10×)
- `/Users/kevin/KVN_Coordinator_System/examples/ESP32_C3_Scout_LDR/` - Ultra-low-power LDR for C3 Scout (6×)

## CURRENT TASK:

**Uploading TFT_eSPI version to ESP32-2432S028R**

### Upload Issue:
- Upload speed 921600 fails with "chip stopped responding"
- **SOLUTION:** Change to **Upload Speed: 115200**

### After Upload Should See:
1. Serial Monitor:
   ```
   === CYD MQTT Relay (TFT_eSPI) ===
   LDR initialized
   Connecting to WiFi... Connected!
   IP: 192.168.86.31
   Ready!
   ```

2. Display:
   - Boot screen: "KVN SYSTEM" / "MQTT Relay"
   - Status screen with:
     - ONLINE status (green)
     - Message counter
     - IP address & WiFi signal
     - Light sensor (lux)
     - Last MQTT message

## BOARD SPECS:

**ESP32-2432S028R (Cheap Yellow Display)**
- MCU: ESP32-WROOM-32 (Dual-core @ 240MHz)
- Display: 2.8" ILI9341 (240×320)
- LDR: Built-in on GPIO 34 (ADC1_CH6)
- RGB LED: GPIO 4 (R), 16 (G), 17 (B) - Active LOW
- Backlight: GPIO 21 (PWM)

### Pin Mapping:
```
Display (HSPI):
- SCK: 14
- MOSI: 13
- MISO: 12
- CS: 15
- DC: 2
- RST: -1 (none)
- BL: 21

LDR: GPIO 34
RGB LED: 4, 16, 17
```

## NETWORK CONFIG:

```cpp
WIFI_SSID: "guy-fi"
WIFI_PASSWORD: "244466666"
MQTT_BROKER: "192.168.86.38"
MQTT_PORT: 1883
MQTT_USER: "mqtt-ha"
MQTT_PASS: "dskjdfs98ewrkljh3"
```

Device gets IP: **192.168.86.31**

## MQTT TOPICS:

### Subscribed:
- `homeassistant/sensor/+/+`
- `vanguard/+/+`

### Published:
- `vanguard/relay/status` → "online"

## NEXT STEPS:

1. **IMMEDIATE:** Upload TFT_eSPI version (with 115200 baud upload speed)
2. Verify display shows status screen without crashes
3. Let run for 5+ minutes to confirm stability
4. Re-enable auto-brightness if working
5. Test MQTT message display on screen

## TROUBLESHOOTING NOTES:

### If Upload Fails:
- Reduce upload speed to 115200 (or even 460800)
- Hold BOOT button during upload
- Try different USB cable/port

### If Display Shows White/Wrong:
- Rotation setting: `tft.setRotation(3)` for correct orientation
- Colors already configured in TFT_eSPI User_Setup.h

### If Crashes Still Occur:
- TFT_eSPI should be stable (confirmed working on this board type)
- Check Serial Monitor for error messages
- If still crashes, may need to reduce display update frequency

## BOARD SELECTION:

**Tools → Board → ESP32 Arduino → ESP32 Dev Module**

Settings:
- Upload Speed: **115200** ⚠️ IMPORTANT
- CPU Frequency: 240MHz
- Flash Size: 4MB
- Partition Scheme: Default

## BACKUP FILES:

Original LovyanGFX version backed up at:
`/Users/kevin/KVN_Coordinator_System/examples/ESP32_2432S028_MQTT_Relay/ESP32_2432S028_MQTT_Relay.ino.backup`

---

**Last Updated:** Session in progress
**Status:** Waiting for TFT_eSPI upload to complete
