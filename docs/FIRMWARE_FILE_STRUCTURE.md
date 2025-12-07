# AI Coordinator Firmware - File Organization Guide

**For: Trae (AI Developer)**
**Purpose: Where to put ALL firmware files**

## 📂 Root Directory Structure

```
AI_Coordinator_System/
│
├── libraries/                      # Shared libraries (DROP HERE)
│   ├── ESP32_AI/                   # Intelligence library
│   │   ├── ESP32_AI.h
│   │   └── ESP32_AI.cpp
│   └── TFT_eSPI/                   # Display drivers
│       └── User_Setup.h            # ⚠️ CRITICAL: Edit this for your display
│
├── examples/                       # Device-specific firmware
│   │
│   ├── Complete_Sensor_System/     # ESP32-P4 HUB (The Brain)
│   │   ├── Complete_Sensor_System.ino  # Main hub sketch
│   │   ├── secrets.h               # ⚠️ WiFi + API keys (KEEP PRIVATE!)
│   │   └── hub_config.h            # P4 pin definitions
│   │
│   ├── ESP32_S3_Advanced_Node/     # ESP32-S3 Nodes (10 devices)
│   │   ├── ESP32_S3_Advanced_Node.ino  # S3 main sketch
│   │   └── s3_config.h             # S3 pin definitions
│   │
│   └── ESP32_C3_Simple_Node/       # ESP32-C3 Scouts (6 devices)
│       ├── ESP32_C3_Simple_Node.ino    # C3 main sketch
│       └── c3_config.h             # C3 pin definitions
│
└── docs/                           # Documentation (reference only)
    ├── PIN_CONFIGURATIONS.md
    └── DEPLOYMENT_GUIDE.md
```

---

## 🎯 Trae: Where to Put YOUR Files

### 1. Arduino Libraries Location

**If you've created custom libraries:**

```bash
# On macOS:
~/Documents/Arduino/libraries/ESP32_AI/
~/Documents/Arduino/libraries/TFT_eSPI/

# On Windows:
Documents\Arduino\libraries\ESP32_AI\
Documents\Arduino\libraries\TFT_eSPI\

# On Linux:
~/Arduino/libraries/ESP32_AI/
~/Arduino/libraries/TFT_eSPI/
```

**Action:** Copy the `ESP32_AI/` and `TFT_eSPI/` folders into your Arduino libraries directory.

---

### 2. Sketch Files (Main Firmware)

**Each device type has its own sketch folder:**

#### ESP32-P4 Hub (1 device):
```
AI_Coordinator_System/examples/Complete_Sensor_System/
├── Complete_Sensor_System.ino  ← Main loop, initialization
├── secrets.h                    ← WiFi SSID, password, API keys
└── hub_config.h                 ← GPIO pin definitions for P4
```

#### ESP32-S3 Nodes (10 devices):
```
AI_Coordinator_System/examples/ESP32_S3_Advanced_Node/
├── ESP32_S3_Advanced_Node.ino  ← Camera/display logic
└── s3_config.h                  ← GPIO pins for S3
```

#### ESP32-C3 Scouts (6 devices):
```
AI_Coordinator_System/examples/ESP32_C3_Simple_Node/
├── ESP32_C3_Simple_Node.ino    ← Sensor reading logic
└── c3_config.h                  ← GPIO pins for C3
```

---

## 🔐 Critical: secrets.h File

**Location:** `examples/Complete_Sensor_System/secrets.h` (P4 Hub only)

```cpp
// secrets.h - WiFi and AI API Configuration
// ⚠️ DO NOT commit this to git! Add to .gitignore

#ifndef SECRETS_H
#define SECRETS_H

// WiFi Configuration
#define WIFI_SSID "guy-fi"              // Primary network
#define WIFI_PASSWORD "your-password"    // Network password
#define WIFI_FALLBACK_SSID "backup-network"  // Optional backup

// Hub IP Configuration
#define HUB_IP "192.168.1.100"          // Static IP for P4 Hub

// AI API Keys
#define ANTHROPIC_API_KEY "sk-ant-..."  // Claude (Recommended)
#define OPENAI_API_KEY "sk-..."         // GPT (Optional)
#define GEMINI_API_KEY "AIza..."        // Gemini (Optional)

// MQTT Broker (if using)
#define MQTT_SERVER "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_USER "vanguard"
#define MQTT_PASSWORD "secure-password"

#endif
```

**⚠️ IMPORTANT:**
- Only the P4 Hub needs `secrets.h` (it coordinates everything)
- C3/S3 nodes connect to the hub, not directly to AI APIs
- Keep this file OUT of version control (add to .gitignore)

---

## 📌 Pin Configuration Files

### hub_config.h (ESP32-P4)

**Location:** `examples/Complete_Sensor_System/hub_config.h`

```cpp
// hub_config.h - ESP32-P4 Pin Definitions
#ifndef HUB_CONFIG_H
#define HUB_CONFIG_H

// UART Connections
#define UART1_RX 16  // LD2420 Bed Radar
#define UART1_TX 17
#define UART2_RX 18  // LD2420 Door Radar
#define UART2_TX 19
#define UART3_RX 26  // RD03-EG521 Zone Radar
#define UART4_TX 33  // RD03-DG521 Intent Radar

// I2C Bus
#define I2C_SDA 21
#define I2C_SCL 22
#define BH1750_ADDR 0x23
#define GRAVITY_AI_1 0x62
#define GRAVITY_AI_2 0x63

// I2S Microphone
#define I2S_WS 25
#define I2S_SCK 32
#define I2S_SD 34

#endif
```

### s3_config.h (ESP32-S3)

**Location:** `examples/ESP32_S3_Advanced_Node/s3_config.h`

```cpp
// s3_config.h - ESP32-S3 Pin Definitions
#ifndef S3_CONFIG_H
#define S3_CONFIG_H

// SPI Display (ILI9341/ILI9488)
#define TFT_CS 4
#define TFT_DC 5
#define TFT_RST 6
#define TFT_MOSI 7
#define TFT_CLK 8

// UART Radar (HIGH GPIOs to avoid I2S conflict!)
#define RADAR_RX 44
#define RADAR_TX 43

// I2C (Optional)
#define I2C_SDA 9
#define I2C_SCL 10

#endif
```

### c3_config.h (ESP32-C3)

**Location:** `examples/ESP32_C3_Simple_Node/c3_config.h`

```cpp
// c3_config.h - ESP32-C3 Pin Definitions
#ifndef C3_CONFIG_H
#define C3_CONFIG_H

// Power Control
#define SENSOR_POWER_PIN 8  // MOSFET gate control

// UART Radar
#define RADAR_RX 6
#define RADAR_TX 7

// I2C Sensors
#define I2C_SDA 4
#define I2C_SCL 5

// Battery Monitor (ADC)
#define BATTERY_ADC_PIN 3

// Boot Pin (Avoid!)
#define BOOT_PIN 2  // DO NOT USE for sensors!

#endif
```

---

## 🚀 Arduino IDE Setup

### Step 1: Install Board Support

**File → Preferences → Additional Board Manager URLs:**
```
https://espressif.github.io/arduino-esp32/package_esp32_index.json
```

**Tools → Board → Boards Manager:**
- Install "esp32 by Espressif Systems" (Version 3.x+)

### Step 2: Install Libraries

**Tools → Manage Libraries:**
- ArduinoJson
- TFT_eSPI
- Adafruit_SSD1306
- Adafruit GFX
- DHT sensor library

### Step 3: Open the Sketch

**For C3 Scouts (flash these first):**
```
File → Open → AI_Coordinator_System/examples/ESP32_C3_Simple_Node/ESP32_C3_Simple_Node.ino
```

**For S3 Nodes (flash second):**
```
File → Open → AI_Coordinator_System/examples/ESP32_S3_Advanced_Node/ESP32_S3_Advanced_Node.ino
```

**For P4 Hub (flash last):**
```
File → Open → AI_Coordinator_System/examples/Complete_Sensor_System/Complete_Sensor_System.ino
```

---

## ⚙️ Board Settings for Each Device

### ESP32-C3 Settings:
- **Board:** ESP32C3 Dev Module
- **USB CDC On Boot:** Enabled
- **Flash Size:** 4MB
- **CPU Frequency:** 160MHz

### ESP32-S3 Settings:
- **Board:** ESP32S3 Dev Module
- **USB CDC On Boot:** Enabled
- **Flash Size:** 8MB or 16MB
- **PSRAM:** OPI PSRAM (for camera nodes)
- **Partition Scheme:** Huge APP (3MB No OTA/1MB SPIFFS)

### ESP32-P4 Settings:
- **Board:** ESP32P4 Dev Module
- **Flash Size:** 16MB
- **Partition Scheme:** Default (or maximize APP space)

---

## 🔍 Quick Reference: What Goes Where

| File Type | Location | Purpose |
|-----------|----------|---------|
| **Main sketches (.ino)** | `examples/[device-type]/` | Device firmware |
| **Config headers (.h)** | Same folder as .ino | Pin definitions |
| **secrets.h** | `Complete_Sensor_System/` | API keys, WiFi (P4 only) |
| **Libraries** | `~/Documents/Arduino/libraries/` | Shared code |
| **Display setup** | `libraries/TFT_eSPI/User_Setup.h` | Screen driver config |

---

## ✅ Validation Checklist

After placing files:

- [ ] Libraries folder copied to Arduino libraries directory
- [ ] All three sketch folders exist in `examples/`
- [ ] Each sketch has its config.h file
- [ ] secrets.h created with real credentials (P4 only)
- [ ] TFT_eSPI/User_Setup.h edited for display type
- [ ] Arduino IDE can open each sketch without errors
- [ ] Board settings configured for each device type

---

## 🆘 Troubleshooting

**"File not found" errors:**
- Check that config.h files are in the SAME folder as the .ino file
- Arduino requires sketch folder name to match .ino filename

**"Library not found" errors:**
- Verify libraries are in `~/Documents/Arduino/libraries/`
- Restart Arduino IDE after adding libraries

**"secrets.h" missing:**
- Only needed for P4 Hub
- Create it manually using the template above
- C3/S3 nodes don't need it

---

**Ready to flash! Follow the deployment sequence: C3 → S3 → P4**
