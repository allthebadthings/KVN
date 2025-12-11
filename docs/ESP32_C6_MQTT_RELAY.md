# ESP32-C6 MQTT Relay - KVN System

**Last Updated:** 2025-12-08
**Board:** Waveshare ESP32-C6-LCD-1.47
**Role:** Dedicated MQTT Message Relay & Network Monitor

---

## OVERVIEW

The ESP32-C6 MQTT Relay acts as an intelligent bridge between the 16 KVN ESP32 devices and the Home Assistant MQTT broker. It provides visual status monitoring, message buffering, and failover capabilities.

```
┌─────────────────────────────────────────────────────────┐
│                    KVN Network Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ESP32 Devices (17 total)                               │
│  ├── ESP32-P4 Hub (1×)                                  │
│  ├── ESP32-S3 Watchtower Nodes (10×)                    │
│  └── ESP32-C3 Scout Nodes (6×)                          │
│                    ↓                                      │
│              MQTT Messages                               │
│                    ↓                                      │
│         ┌──────────────────────┐                        │
│         │  ESP32-C6 MQTT Relay │ ← YOU ARE HERE         │
│         │  - Message Routing    │                        │
│         │  - Visual Monitoring  │                        │
│         │  - Buffering/Failover │                        │
│         └──────────────────────┘                        │
│                    ↓                                      │
│         ┌──────────────────────┐                        │
│         │  Home Assistant MQTT │                        │
│         │  Broker (Mosquitto)  │                        │
│         │  192.168.86.38:1883  │                        │
│         └──────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## HARDWARE SPECIFICATIONS

### Waveshare ESP32-C6-LCD-1.47 Board

**Processor:**
- ESP32-C6 RISC-V 32-bit single-core @ 160MHz
- Low-power RISC-V core @ 20MHz
- 320KB ROM, 512KB HP SRAM, 16KB LP SRAM
- 4MB Flash

**Display:**
- 1.47" IPS LCD (ST7789 driver)
- Resolution: 172×320 pixels
- Color: 262K (RGB565)
- SPI interface

**Connectivity:**
- WiFi 6 (802.11ax) 2.4GHz
- Bluetooth 5.0 (BLE)
- IEEE 802.15.4 (Zigbee/Thread capable)

**Peripherals:**
- USB Type-C (programming + power)
- MicroSD card slot
- RGB LED with acrylic diffuser
- 15 GPIO pins exposed

**Power:**
- USB 5V input
- 3.3V logic level

---

## PINOUT REFERENCE

### Display (Pre-wired internally)
| Function | GPIO | Notes |
|----------|------|-------|
| SPI CLK  | 7    | Display clock |
| SPI MOSI | 6    | Display data |
| CS       | 14   | Chip select |
| DC       | 15   | Data/Command |
| RST      | 21   | Display reset |
| BL       | 22   | Backlight PWM |

### Available GPIO Pins (15 pins exposed)
These pins are available for expansion:
- GPIO 0, 1, 2, 3, 4, 5, 8, 9, 10, 18, 19, 20, 23
- 6 pins support analog input (ADC)
- All pins support PWM

### I2C (Optional)
Default I2C pins for sensors:
- **SDA:** GPIO 4
- **SCL:** GPIO 5

### UART (Optional)
- **TX:** GPIO 16
- **RX:** GPIO 17

---

## NETWORK CONFIGURATION

### WiFi Settings
```cpp
#define RELAY_WIFI_SSID "guy-fi"
#define RELAY_WIFI_PASSWORD "244466666"
#define RELAY_STATIC_IP "192.168.86.50"  // Dedicated IP for relay
```

### MQTT Broker Connection
```cpp
// Home Assistant MQTT Broker
#define MQTT_BROKER_IP "192.168.86.38"
#define MQTT_BROKER_PORT 1883
#define MQTT_USERNAME "mqtt-ha"
#define MQTT_PASSWORD "dskjdfs98ewrkljh3"
```

### Relay MQTT Server (Optional)
The relay can act as a secondary MQTT broker for local message caching:
```cpp
#define RELAY_MQTT_PORT 1884  // Alternative port for direct device connections
```

---

## RELAY OPERATION MODES

### Mode 1: Transparent Relay (Default)
All MQTT messages pass through relay to Home Assistant without modification.

**Advantages:**
- Simple architecture
- No message processing overhead
- Minimal latency

**Use Case:** Basic monitoring and failsafe

### Mode 2: Intelligent Buffering
Relay buffers messages locally when Home Assistant is unreachable.

**Features:**
- 100-message ring buffer in SRAM
- Automatic replay when HA reconnects
- Prevents message loss during outages

**Use Case:** Critical sensor data preservation

### Mode 3: Local MQTT Broker
Relay runs a lightweight MQTT broker for device-to-device communication.

**Features:**
- Devices connect to relay (192.168.86.50:1884)
- Relay forwards to Home Assistant
- Enables local automation without HA

**Use Case:** Low-latency local control

---

## LCD DISPLAY LAYOUT

### Status Screen (Default)
```
┌─────────────────────────┐
│  KVN MQTT RELAY         │
│  ════════════════       │
│                         │
│  WiFi: ●●●●○ -67dBm     │
│  MQTT: CONNECTED        │
│                         │
│  Devices Online: 16/17  │
│  Messages/sec: 23       │
│                         │
│  HA Broker: ✓ ONLINE    │
│  Uptime: 3d 4h 12m      │
│                         │
│  [Mode: Transparent]    │
└─────────────────────────┘
```

### Device List Screen (Press BOOT button)
```
┌─────────────────────────┐
│  CONNECTED DEVICES      │
│  ════════════════       │
│                         │
│  ✓ P4-Hub      12s ago  │
│  ✓ S3-Node-01   2s ago  │
│  ✓ S3-Node-02   1s ago  │
│  ✗ S3-Node-03  OFFLINE  │
│  ✓ C3-Scout-01  5s ago  │
│  ✓ C3-Scout-02  3s ago  │
│                         │
│  16/17 Online           │
└─────────────────────────┘
```

### Message Traffic Screen
```
┌─────────────────────────┐
│  MQTT TRAFFIC           │
│  ════════════════       │
│                         │
│  RX: 1,234 msg          │
│  TX: 1,198 msg          │
│  Buffer: 0/100          │
│                         │
│  Top Publishers:        │
│  S3-Node-01: 45 msg/m   │
│  S3-Node-02: 38 msg/m   │
│  P4-Hub: 22 msg/m       │
│                         │
└─────────────────────────┘
```

---

## RGB LED STATUS CODES

| Color | Pattern | Meaning |
|-------|---------|---------|
| Green | Solid | Normal operation |
| Blue | Slow pulse | Connecting to WiFi |
| Cyan | Fast pulse | Connecting to MQTT |
| Yellow | Solid | HA offline (buffering) |
| Red | Slow blink | WiFi disconnected |
| Red | Fast blink | Critical error |
| Purple | Breathing | OTA update mode |

---

## FIRMWARE LIBRARIES REQUIRED

```cpp
// Platform
#include <WiFi.h>
#include <PubSubClient.h>

// Display
#include <TFT_eSPI.h>
#include <SPI.h>

// Optional for advanced features
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
```

---

## POWER CONSUMPTION

| Mode | Current | Daily Cost (USB 5V) |
|------|---------|---------------------|
| Idle (display on) | ~120mA | 0.014 kWh (~$0.002) |
| Active relay | ~180mA | 0.022 kWh (~$0.003) |
| Peak (WiFi TX) | ~350mA | N/A (burst) |

**Daily Operating Cost:** < $0.01 USD

---

## MOUNTING & PLACEMENT

**Recommended Location:**
- Near WiFi router for strong signal
- Central to ESP32 device locations
- Visible for status monitoring
- Accessible USB power outlet

**Enclosure Options:**
1. 3D printed case (STL files TBD)
2. Acrylic standoff mount
3. Adhesive wall mount

---

## INTEGRATION WITH KVN SYSTEM

### Update Device Count
Total KVN devices: **18** (was 17)
- 1× ESP32-P4 Hub
- 10× ESP32-S3 Watchtower
- 6× ESP32-C3 Scout
- **1× ESP32-C6 MQTT Relay** ← NEW

### Topic Subscription (Relay subscribes to)
```
homeassistant/sensor/+/+      # All sensor data
vanguard/control/+/+           # All control commands
vanguard/ai/+                  # AI insights/alerts
```

### Status Publishing (Relay publishes to)
```
vanguard/relay/status          # Online/offline status
vanguard/relay/stats           # Message counts, uptime
vanguard/relay/devices         # Connected device list
```

---

## TROUBLESHOOTING

### Display Not Working
**Symptoms:** Blank screen or garbled output

**Solutions:**
1. Check TFT_eSPI user_setup config for ST7789
2. Verify SPI pins: CLK=7, MOSI=6, CS=14, DC=15, RST=21
3. Increase backlight PWM: `analogWrite(22, 255);`

### MQTT Connection Fails
**Check:**
```cpp
// Enable debug output
mqtt.setCallback(callback);
mqtt.setBufferSize(2048);  // Increase if needed

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Topic: ");
    Serial.println(topic);
}
```

### High Memory Usage
**Reduce buffer size:**
```cpp
#define MAX_BUFFER_SIZE 50  // Reduce from 100
```

---

## FUTURE ENHANCEMENTS

- [ ] MicroSD logging of all MQTT messages
- [ ] Web interface on relay (port 80)
- [ ] OTA firmware updates via MQTT
- [ ] Device health alerting
- [ ] Traffic analytics and graphs
- [ ] Zigbee/Thread gateway functionality

---

**Sources:**
- [Waveshare ESP32-C6-LCD-1.47 Wiki](https://www.waveshare.com/wiki/ESP32-C6-LCD-1.47)
- [ESP32-C6 Product Page](https://www.waveshare.com/esp32-c6-lcd-1.47.htm)

**Questions?** See main [KVN Documentation Index](../AI_COORDINATOR_DOCUMENTATION_INDEX.md)
