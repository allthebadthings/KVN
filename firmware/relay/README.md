# ESP32-C6 MQTT Relay Firmware

Dedicated MQTT relay for the KVN smart home system with real-time status display.

## Hardware Required

- **Waveshare ESP32-C6-LCD-1.47** development board
- USB-C cable for programming and power
- (Optional) Enclosure or mount

## Features

- Real-time MQTT message relay between KVN devices and Home Assistant
- 1.47" color LCD status display showing:
  - WiFi signal strength
  - MQTT connection status
  - Connected device count
  - Message throughput (RX/TX)
  - Buffer status
  - System uptime
- Message buffering during Home Assistant outages
- Automatic device discovery and monitoring
- Visual status indicators

## Installation

### 1. Install Arduino IDE

Download and install Arduino IDE 2.x from https://www.arduino.cc/en/software

### 2. Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32"
6. Install **"esp32 by Espressif Systems"** (v3.0.0 or newer)

### 3. Install Required Libraries

Go to **Tools → Manage Libraries** and install:

| Library | Version | Purpose |
|---------|---------|---------|
| TFT_eSPI | 2.5.0+ | LCD display driver |
| PubSubClient | 2.8.0+ | MQTT client |
| ArduinoJson | 6.21.0+ | JSON parsing (optional) |

### 4. Configure TFT_eSPI Library

**IMPORTANT:** The TFT_eSPI library needs custom pin configuration.

**Option A: Replace User_Setup.h (Recommended)**
```bash
# Find your Arduino libraries folder:
# macOS: ~/Documents/Arduino/libraries/
# Windows: Documents\Arduino\libraries\
# Linux: ~/Arduino/libraries/

# Backup original
cp Arduino/libraries/TFT_eSPI/User_Setup.h Arduino/libraries/TFT_eSPI/User_Setup.h.backup

# Copy our configuration
cp User_Setup.h Arduino/libraries/TFT_eSPI/User_Setup.h
```

**Option B: Edit User_Setup.h manually**
```cpp
// Open: Arduino/libraries/TFT_eSPI/User_Setup.h
// Set these values:

#define ST7789_DRIVER
#define TFT_WIDTH  172
#define TFT_HEIGHT 320

#define TFT_MOSI 6
#define TFT_SCLK 7
#define TFT_CS   14
#define TFT_DC   15
#define TFT_RST  21
#define TFT_BL   22

#define SPI_FREQUENCY 40000000
```

### 5. Configure Network Settings

Edit `ESP32_C6_MQTT_Relay.ino`:

```cpp
// WiFi Configuration
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"
#define RELAY_STATIC_IP IPAddress(192, 168, 86, 50)  // Change to match your network

// MQTT Broker Configuration
#define MQTT_BROKER "192.168.86.38"  // Your MQTT broker IP
#define MQTT_PORT 1883
#define MQTT_USER "mqtt-ha"
#define MQTT_PASS "your-mqtt-password"
```

**Security Note:** For production use, create `secrets.h` and include it instead of hardcoding credentials.

### 6. Upload Firmware

1. Connect ESP32-C6 board via USB-C
2. Select **Tools → Board → ESP32 Arduino → ESP32C6 Dev Module**
3. Select **Tools → Port** (choose your USB serial port)
4. Set **Tools → Upload Speed → 921600**
5. Click **Upload** button (→)

**Troubleshooting Upload:**
- If upload fails, hold BOOT button while connecting USB
- Try lower upload speed (115200)
- Check USB cable supports data transfer (not charge-only)

## Usage

### First Boot

1. Power on the board via USB-C
2. Display shows:
   - "KVN MQTT RELAY" boot screen
   - "Connecting WiFi..." (blue)
   - "WiFi Connected!" (green)
   - "Connecting MQTT..." (yellow)
   - "MQTT Connected!" (green)
3. After 2 seconds, switches to status screen

### Status Screen (Default)

Shows real-time system status:
- WiFi signal strength (dBm + signal bars)
- MQTT connection status
- Device count (online/total)
- Message stats (RX/TX)
- Buffer usage
- Home Assistant broker status
- System uptime

### Switching Screens

**BOOT Button:** Press to cycle through screens:
1. **Status Screen** - Main dashboard
2. **Device Screen** - List of connected KVN devices
3. (Future) Traffic analysis

### Serial Monitor

Open **Tools → Serial Monitor** (115200 baud) to see:
- Connection logs
- MQTT messages in real-time
- Device discovery notifications
- Error messages

## Network Architecture

```
KVN Devices (17)        ESP32-C6 Relay          Home Assistant
─────────────────       ────────────────        ──────────────
ESP32-P4 Hub    ─┐
ESP32-S3 Node-1 ─┤
ESP32-S3 Node-2 ─┤
     ...        ─┼──►  [MQTT Relay]  ────►    [MQTT Broker]
ESP32-C3 Scout-1─┤      192.168.86.50          192.168.86.38:1883
ESP32-C3 Scout-2─┤
     ...        ─┘
```

### MQTT Topics

**Subscribed (Relay listens to):**
- `homeassistant/sensor/+/+` - All sensor data
- `vanguard/control/+/+` - Control commands
- `vanguard/ai/+` - AI insights/alerts

**Published (Relay sends to):**
- `vanguard/relay/status` - "online"/"offline"
- `vanguard/relay/stats` - JSON stats every second

## Troubleshooting

### Display Issues

**Problem:** Blank or garbled display

**Solutions:**
1. Check TFT_eSPI configuration is correct
2. Verify backlight: Pin 22 should be HIGH
3. Try manual backlight test:
   ```cpp
   pinMode(22, OUTPUT);
   digitalWrite(22, HIGH);
   ```
4. Check SPI pins in User_Setup.h match hardware

### WiFi Connection Fails

**Problem:** Stuck on "Connecting WiFi..."

**Solutions:**
1. Verify SSID and password are correct
2. Ensure WiFi is 2.4GHz (ESP32-C6 supports WiFi 6 but still 2.4GHz band)
3. Check router allows new devices
4. Move closer to router
5. Check serial monitor for error codes

### MQTT Connection Fails

**Problem:** "MQTT: OFFLINE" on display

**Solutions:**
1. Ping MQTT broker: `ping 192.168.86.38`
2. Check Mosquitto is running on Home Assistant
3. Verify MQTT credentials (username/password)
4. Test with MQTT client:
   ```bash
   mosquitto_sub -h 192.168.86.38 -p 1883 -u mqtt-ha -P yourpass -t "#"
   ```
5. Check firewall allows port 1883

### No Devices Appear

**Problem:** Device count shows 0/17

**Explanation:** Devices only appear when they publish MQTT messages

**Solutions:**
1. Ensure other KVN devices are online and publishing
2. Check MQTT topics match expected format:
   - `homeassistant/sensor/esp32_XXXXXX/...`
3. Check serial monitor for "New device discovered" messages
4. Manually publish test message:
   ```bash
   mosquitto_pub -h 192.168.86.38 -u mqtt-ha -P yourpass \
     -t "homeassistant/sensor/esp32_test/state" -m "test"
   ```

### Compilation Errors

**Error:** `TFT_eSPI.h: No such file or directory`
- Install TFT_eSPI library via Library Manager

**Error:** Multiple definition errors
- Close and reopen Arduino IDE
- Delete build cache: Delete `/tmp/arduino_build_*` folders

**Error:** `'class TFT_eSPI' has no member named...`
- Update TFT_eSPI to latest version (2.5.0+)

## Advanced Configuration

### Message Buffer Size

Adjust buffer for high-traffic scenarios:
```cpp
#define BUFFER_SIZE 100  // Increase to 200-500 for heavy loads
```

**Note:** Each message uses ~100 bytes of RAM

### Display Update Rate

Change screen refresh interval:
```cpp
#define STATUS_UPDATE_INTERVAL 1000  // milliseconds (default 1s)
```

### Device Timeout

Adjust when devices are considered offline:
```cpp
#define DEVICE_TIMEOUT_MS 30000  // 30 seconds (default)
```

### Static IP Configuration

Assign fixed IP to relay:
```cpp
#define RELAY_STATIC_IP IPAddress(192, 168, 86, 50)
#define GATEWAY_IP IPAddress(192, 168, 86, 1)
```

## Performance

| Metric | Value |
|--------|-------|
| Power consumption | ~120-180mA @ 5V |
| MQTT latency | <10ms |
| Max messages/sec | ~500 (with buffering) |
| Display FPS | 1 (default) |
| Memory usage | ~60KB RAM, ~200KB Flash |

## Future Enhancements

- [ ] Button support for screen navigation
- [ ] Web interface for configuration
- [ ] MicroSD card logging
- [ ] OTA firmware updates
- [ ] Traffic analysis graphs
- [ ] Email/SMS alerts for outages

## Troubleshooting Logs

Enable verbose logging:
```cpp
// In setup()
Serial.setDebugOutput(true);
WiFi.setOutputPower(20);  // Max WiFi TX power
```

## Support

For issues or questions:
1. Check serial monitor output
2. Review KVN System documentation: `/docs/ESP32_C6_MQTT_RELAY.md`
3. Check Waveshare wiki: https://www.waveshare.com/wiki/ESP32-C6-LCD-1.47

## License

Part of KVN Coordinator System - Private Project
