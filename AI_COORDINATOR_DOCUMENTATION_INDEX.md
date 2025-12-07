# AI Coordinator System - Complete Documentation Index

**Project:** Vanguard AI Coordinator Smart Home System
**Last Updated:** 2025-12-07
**Status:** Phase 2 Complete (Hardware Design & Documentation)

---

## 📚 DOCUMENTATION OVERVIEW

This index provides quick access to all documentation for the 17-device AI-powered smart home system.

**System Specifications:**
- 1× ESP32-P4 Hub ("The Brain")
- 10× ESP32-S3 Advanced Nodes (Cameras, Displays, Heavy Sensors)
- 6× ESP32-C3 Scouts (Battery-powered, Hallways/Windows)
- AI Integration: Anthropic Claude / OpenAI / Gemini
- Network: MQTT + WebSocket real-time communication
- Interface: Web Dashboard + Mobile App (Flutter)

---

## 🗂️ DOCUMENTATION FILES

### 1. Project Planning & Overview

| File | Description | Size | Purpose |
|------|-------------|------|---------|
| `AI_COORDINATOR_ROADMAP.md` | Master project roadmap for AI collaboration | 22KB | Phase tracking, workflow, knowledge base |
| `AI_COORDINATOR_DOCUMENTATION_INDEX.md` | This file - Central documentation index | - | Quick reference to all docs |

**Location:** `/Users/kevin/`

**Use Cases:**
- Onboarding new AI agents to the project
- Understanding project scope and current status
- Finding specific documentation quickly

---

### 2. Hardware Design & Schematics

| File | Description | Size | Purpose |
|------|-------------|------|---------|
| `ESP32_PINOUTS_REFERENCE.md` | Complete pinout reference for all boards | 15KB | Production assembly, wiring |
| `esp32_p4_hub.kicad_sch` | KiCad schematic for ESP32-P4 Hub | 4.5KB | KiCad design (text-annotated) |
| `esp32_s3_watchtower.kicad_sch` | KiCad schematic for ESP32-S3 Display Node | 3.9KB | KiCad design (text-annotated) |
| `esp32_c3_scout.kicad_sch` | KiCad schematic for ESP32-C3 Scout | 5.7KB | KiCad design (text-annotated) |
| `KICAD_SETUP_GUIDE.md` | How to use KiCad files and design PCBs | 4.2KB | PCB development, production |

**Location:** `/Users/kevin/`

**Use Cases:**
- PCB design and manufacturing
- Hardware assembly and wiring
- Component placement and soldering
- Pin conflict troubleshooting

**Critical Notes:**
- KiCad files contain text-based documentation (not drawn symbols yet)
- Use ESP32_PINOUTS_REFERENCE.md for quick wiring reference
- All pinouts include power requirements, I2C addresses, UART assignments

---

### 3. Firmware & Software Development

| File | Description | Size | Purpose |
|------|-------------|------|---------|
| `FIRMWARE_FILE_STRUCTURE.md` | Complete Arduino project organization guide | 12KB | Where to put firmware files |
| `TRAE_WEBAPP_AGENT_PROMPT.md` | Agent prompt for web dashboard & mobile app development | 18KB | Guide for building UI/UX |
| `NETWORK_CONFIG_GUIDE.md` | Network, MQTT, and AI API configuration | 16KB | WiFi setup, API integration |

**Location:** `/Users/kevin/`

**Use Cases:**
- Setting up Arduino IDE and libraries
- Organizing firmware code for 17 devices
- Understanding project file structure
- Flashing ESP32 boards with correct firmware

**Key Information:**
- **Firmware Structure:**
  ```
  AI_Coordinator_System/
  ├── libraries/              # ESP32_AI, TFT_eSPI
  └── examples/
      ├── Complete_Sensor_System/  # ESP32-P4
      ├── ESP32_S3_Advanced_Node/  # ESP32-S3
      └── ESP32_C3_Simple_Node/    # ESP32-C3
  ```

- **Flashing Sequence:**
  1. Phase 1: Flash ESP32-C3 Scouts (6 devices)
  2. Phase 2: Flash ESP32-S3 Nodes (10 devices)
  3. Phase 3: Flash ESP32-P4 Hub (1 device)

---

### 4. Network & API Configuration

**Primary File:** `NETWORK_CONFIG_GUIDE.md`

**Key Configuration Values:**

```
WiFi SSID: guy-fi
WiFi Password: 244466666
Hub Static IP: 192.168.1.100
MQTT Broker: 192.168.86.38:1883
MQTT User: mqtt-ha
MQTT Password: dskjdfs98ewrkljh3
```

**AI Provider:**
- **Anthropic Claude Haiku** (Recommended)
  - Cost: ~$0.03/day (1000 queries)
  - Speed: 100-200ms
  - API: https://api.anthropic.com/v1/messages

- **OpenAI GPT-4o-mini** (Backup)
  - Cost: ~$0.05/day (1000 queries)
  - Speed: 200-400ms

- **Google Gemini Flash** (Free Tier)
  - Cost: FREE (15 req/min limit)
  - Speed: 300-500ms

**MQTT Topic Structure:**
```
homeassistant/sensor/esp32_XXXXXX/state
homeassistant/sensor/esp32_XXXXXX/temperature
vanguard/control/esp32_XXXXXX/light
vanguard/ai/insights
```

---

### 5. Web Dashboard & Mobile App

**Primary File:** `TRAE_WEBAPP_AGENT_PROMPT.md`

**Technology Stack:**
- **Web Dashboard:** Vue.js (Petite) / Alpine.js
- **Web Server:** AsyncWebServer (ESP32-P4)
- **Real-time:** WebSocket protocol
- **Mobile App:** Flutter (iOS + Android)
- **Styling:** CSS Grid, Dark Mode, Cyberpunk theme

**Dashboard Features:**
- Real-time sensor data tiles (17 rooms)
- AI insights sidebar (Claude recommendations)
- Camera feed grid (MJPEG streams)
- Control panel (lights, locks, HVAC)
- Automation rule builder

**Mobile App Features:**
- Biometric authentication (FaceID/TouchID)
- Push notifications (motion alerts, AI insights)
- Geofencing (auto-arm when leaving)
- Voice commands
- Full-screen camera viewer

**Dashboard URL:** http://192.168.1.100

---

## 🔍 QUICK REFERENCE TABLES

### ESP32 Board Comparison

| Board | CPU | Flash | PSRAM | GPIOs | WiFi | Use Case |
|-------|-----|-------|-------|-------|------|----------|
| ESP32-P4 | 400MHz Dual | 16MB | Yes | Many | WiFi 6 | Hub (Brain) |
| ESP32-S3 | 240MHz Dual | 8-16MB | Yes | 45 | 2.4GHz | Camera/Display |
| ESP32-C3 | 160MHz Single | 4MB | No | 22 | 2.4GHz | Battery Scout |

### Power Requirements

| Component | Voltage | Current | Notes |
|-----------|---------|---------|-------|
| **mmWave Radars** | 5V | 100-150mA | MUST be 5V, not 3.3V! |
| **ESP32 Modules** | 3.3V | 80-500mA | From LDO regulator |
| **I2C Sensors** | 3.3V | 5-20mA | 4.7kΩ pull-ups |
| **Displays** | 3.3V/5V | 50-200mA | Check specific model |
| **Cameras** | 3.3V | 200-300mA | Requires PSRAM |

### I2C Device Addresses

| Device | Address | Bus | Notes |
|--------|---------|-----|-------|
| BH1750 Light Sensor | 0x23 | P4 Hub | Lux measurement |
| Gravity AI Board #1 | 0x62 | P4 Hub | Face detection |
| Gravity AI Board #2 | 0x63 | P4 Hub | Gesture recognition |
| BME680 (Optional) | 0x76/0x77 | Any | Temp/Humidity/Gas |

---

## 📋 NOTEBOOKLM KNOWLEDGE BASE

**Notebook URL:** https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e

**Contains:**
- Complete system architecture
- Sensor specifications and datasheets
- Deployment strategies and floor plans
- Bill of Materials (BOM)
- Assembly instructions
- Testing procedures
- Troubleshooting guides
- Cost analysis
- VANGUARD Program marketing strategy

**How to Query:**
```bash
cd ~/.claude/skills/notebooklm
python scripts/run.py ask_question.py --question "YOUR_QUESTION" --notebook-url "https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e"
```

---

## 🛠️ DEVELOPMENT WORKFLOW

### For Hardware Developers

1. **Read:** `ESP32_PINOUTS_REFERENCE.md`
2. **Design PCB:** Use KiCad files as reference
3. **Order Components:** Check BOM in NotebookLM
4. **Assembly:** Follow pinout reference for wiring
5. **Testing:** Power-on checks, sensor verification

### For Firmware Developers

1. **Read:** `FIRMWARE_FILE_STRUCTURE.md`
2. **Setup:** Install Arduino IDE, ESP32 board support
3. **Configure:** Create `secrets.h` with WiFi/API credentials
4. **Flash:** C3 Scouts → S3 Nodes → P4 Hub
5. **Test:** Serial monitor for connection verification

### For Web/App Developers

1. **Read:** `TRAE_WEBAPP_AGENT_PROMPT.md`
2. **Setup:** Install Vue.js/Flutter development tools
3. **Develop:** Build dashboard prototype
4. **Integrate:** Connect WebSocket to ESP32-P4
5. **Deploy:** Upload to ESP32 SPIFFS, publish app to stores

---

## ⚠️ CRITICAL WARNINGS

### Hardware

1. **⚠️ RADAR POWER:** All mmWave radars require 5V! Do NOT use 3.3V!
2. **⚠️ I2C PULL-UPS:** Always use 4.7kΩ resistors to 3.3V
3. **⚠️ P4 THERMAL:** ESP32-P4 runs HOT - heatsink MANDATORY
4. **⚠️ PIN CONFLICTS:** ESP32-S3 I2S pins conflict with UART - use GPIO43/44 for radar

### Firmware

1. **⚠️ C3 GPIO LIMIT:** ESP32-C3 has very limited GPIOs - plan carefully
2. **⚠️ BOOT PIN:** Do NOT use GPIO2 on C3 for sensors (boot stability)
3. **⚠️ USB CDC:** Enable "USB CDC On Boot" in Arduino IDE or Serial Monitor won't work
4. **⚠️ PSRAM:** ESP32-S3 camera nodes MUST enable PSRAM setting

### Network

1. **⚠️ 2.4GHz ONLY:** C3/S3 boards cannot connect to 5GHz WiFi
2. **⚠️ STATIC IP:** P4 Hub needs static IP or MQTT clients lose connection
3. **⚠️ API KEYS:** NEVER commit secrets.h to git - add to .gitignore
4. **⚠️ RATE LIMITS:** AI APIs have rate limits - add cooldown between calls

---

## 📞 SUPPORT & RESOURCES

### Official ESP32 Documentation
- ESP32-P4: https://www.espressif.com/en/products/socs/esp32-p4
- ESP32-S3: https://www.espressif.com/en/products/socs/esp32-s3
- ESP32-C3: https://www.espressif.com/en/products/socs/esp32-c3

### Arduino Libraries
- AsyncWebServer: https://github.com/me-no-dev/ESPAsyncWebServer
- PubSubClient (MQTT): https://github.com/knolleary/pubsubclient
- ArduinoJson: https://arduinojson.org/
- TFT_eSPI: https://github.com/Bodmer/TFT_eSPI

### AI Provider Documentation
- Anthropic Claude: https://docs.anthropic.com/
- OpenAI API: https://platform.openai.com/docs/
- Google Gemini: https://ai.google.dev/docs

### Community Resources
- ESP32 Forum: https://esp32.com/
- Home Assistant: https://www.home-assistant.io/
- Flutter: https://flutter.dev/

---

## ✅ PROJECT STATUS

### Completed Phases

- ✅ **Phase 1: System Architecture Design** - Complete
- ✅ **Phase 2: Hardware Design & Documentation** - Complete
  - Pinout reference documents
  - KiCad schematic files
  - Component specifications
  - Power architecture

### Current Phase

- 🟡 **Phase 3: Firmware & Software Development** - In Progress
  - Firmware file structure defined
  - Network configuration documented
  - Web dashboard specifications ready
  - Mobile app design complete
  - **Next:** Begin coding firmware for C3 Scouts

### Upcoming Phases

- ⬜ **Phase 4: Integration & Testing**
- ⬜ **Phase 5: Deployment & Production**
- ⬜ **Phase 6: Monitoring & Optimization**

---

## 📦 FILE LOCATIONS

**All documentation is located in:** `/Users/kevin/`

**Quick Access Commands:**
```bash
# View roadmap
cat ~/AI_COORDINATOR_ROADMAP.md

# View pinout reference
cat ~/ESP32_PINOUTS_REFERENCE.md

# View firmware structure
cat ~/FIRMWARE_FILE_STRUCTURE.md

# View network config
cat ~/NETWORK_CONFIG_GUIDE.md

# View webapp prompt
cat ~/TRAE_WEBAPP_AGENT_PROMPT.md

# View this index
cat ~/AI_COORDINATOR_DOCUMENTATION_INDEX.md
```

---

## 🎯 NEXT ACTIONS

### For Kevin (Project Owner)
1. Provide AI API keys (Anthropic/OpenAI/Gemini)
2. Confirm network credentials
3. Order ESP32 boards and sensors (see BOM in NotebookLM)
4. Set up development environment

### For Firmware Team
1. Review `FIRMWARE_FILE_STRUCTURE.md`
2. Set up Arduino IDE with ESP32 board support
3. Create project folder structure
4. Begin coding C3 Scout firmware

### For Web/App Team
1. Review `TRAE_WEBAPP_AGENT_PROMPT.md`
2. Set up Vue.js/Flutter development environment
3. Create dashboard prototype
4. Design mobile app UI mockups

### For Hardware Team
1. Review `ESP32_PINOUTS_REFERENCE.md`
2. Order PCB prototyping supplies
3. Design test jigs
4. Plan thermal management for P4 Hub

---

## 📝 DOCUMENT CHANGE LOG

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Initial documentation package created | Claude |
| 2025-12-07 | Added firmware file structure guide | Claude |
| 2025-12-07 | Added network configuration guide | Claude |
| 2025-12-07 | Added web/app development prompt | Claude |
| 2025-12-07 | Created master documentation index | Claude |

---

**All systems documented. Ready for development phase.** 🚀

**Questions? Query NotebookLM or review this index for quick answers.**
