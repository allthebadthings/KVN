# AI Coordinator Smart Home System - Project Roadmap

**Last Updated:** December 6, 2025
**Project Status:** Production Documentation Phase
**Goal:** Build a 17-device AI-powered smart home system with ESP32 hardware

---

## 🎯 Project Overview

### What We're Building

An **AI-powered smart home coordination system** called the "Vanguard" that uses:
- **ESP32 microcontrollers** (P4, S3, C3 variants)
- **mmWave radar sensors** for presence detection
- **AI vision** for face/gesture recognition
- **Environmental sensors** for light, temperature
- **Anthropic Claude / OpenAI / Gemini** for intelligence
- **Predictive automation** that learns user behavior

### Core Concept

Instead of simple "if this, then that" rules, this system uses **AI to understand context**:
- Detects WHO is in a room (face recognition)
- Knows WHAT they're doing (gesture/posture analysis)
- Predicts WHERE they're going (movement patterns)
- Decides HOW to respond (AI reasoning)

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│           Cloud AI (Anthropic/OpenAI/Gemini)        │
│                 "The Intelligence"                   │
└────────────────────┬────────────────────────────────┘
                     │ API Calls
                     ↓
┌─────────────────────────────────────────────────────┐
│         ESP32-P4 Hub (Master Bedroom)               │
│              "The Brain"                             │
│  • Aggregates all sensor data                       │
│  • Makes AI decisions                               │
│  • Coordinates fleet                                │
└────────────┬───────────────────────────────────────┘
             │ WiFi Mesh / MQTT
             ↓
┌────────────────────────────────────────────────────┐
│              The Fleet (17 Devices)                 │
├────────────────────────────────────────────────────┤
│  ESP32-S3 "Advanced Nodes" (10 units)              │
│    • Living Room: Camera + Display                 │
│    • Kitchen: Radar + Environmental                │
│    • Office: Display + Sensors                     │
│                                                     │
│  ESP32-C3 "Scouts" (6 units)                       │
│    • Hallways: Motion detection                    │
│    • Doors: Entry/exit tracking                    │
│    • Battery powered, deep sleep                   │
└────────────────────────────────────────────────────┘
```

---

## ✅ Phase 1: Hardware Design (COMPLETED)

### What We Accomplished

1. **Pin Configuration Mapping**
   - Complete GPIO assignments for all 3 board types
   - UART/I2C/SPI/I2S interfaces defined
   - Conflict resolution (I2S vs UART)
   - I2C address assignments (0x62, 0x63 for Gravity AI)

2. **Power Architecture**
   - 5V requirement for radars (LD2420, RD03)
   - 3.3V logic for MCU and sensors
   - LDO specifications (>800mA for P4, >500mA for S3)
   - Battery management for C3 (HT7333 low-quiescent LDO)

3. **PCB Layout Specifications**
   - 4-layer stackup for P4 Hub
   - Thermal via matrix (5x5 grid under P4 chip)
   - Trace widths (30-40mil for 5V, 20-25mil for 3.3V)
   - Antenna keep-out zones
   - Ground plane strategy (star topology)

4. **Component Selection**
   - ESP32-P4: 400MHz dual-core, WiFi 6 (Hub)
   - ESP32-S3: AI-capable, PSRAM (Advanced nodes)
   - ESP32-C3: Compact, low-power (Scouts)
   - Sensors: HLK-LD2420, RD03, Gravity AI, BH1750, INMP441

5. **Bill of Materials (BOM)**
   - Cost analysis: $300-400 for full 17-device fleet
   - Supplier sources (Espressif, Hi-Link, DFRobot)
   - Part numbers and quantities

---

## 📁 Phase 2: Documentation Created (COMPLETED)

### Files Generated

All files located in: `/Users/kevin/`

#### **1. Schematic Documentation**
```
esp32_p4_hub.kicad_sch          - P4 Hub schematic template
esp32_s3_watchtower.kicad_sch   - S3 Display+Radar config
esp32_c3_scout.kicad_sch        - C3 Battery scout config
KICAD_SETUP_GUIDE.md            - How to use KiCad files
```

**Purpose:**
- KiCad-compatible schematic files
- Contains text-based documentation (pinouts, values, warnings)
- Use as templates for creating full PCB designs

#### **2. Reference Documentation**
```
ESP32_PINOUTS_REFERENCE.md      - Complete production reference
AI_COORDINATOR_ROADMAP.md       - This file (master roadmap)
```

**Purpose:**
- Human-readable pinout tables
- Assembly instructions
- Component values
- Critical warnings

#### **3. NotebookLM Integration**
```
Location: ~/.claude/skills/notebooklm/
Notebook URL: https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e
```

**Contains:**
- Original design documents (PIN_CONFIGURATIONS.md)
- Sensor wiring guides (YOUR_SENSORS_GUIDE.md)
- Deployment strategies (MULTI_DEVICE_DEPLOYMENT.md)
- Firmware flashing instructions
- Network configuration
- API setup guides
- Cost analysis
- Marketing strategy (Vanguard Program)

---

## 🔧 Phase 3: Hardware Assembly (NEXT STEPS)

### Assembly Order

**Phase 1: Scout Deployment (C3 Boards)**
- Simplest configuration
- Test basic connectivity
- Validate power consumption

**Phase 2: Advanced Nodes (S3 Boards)**
- Camera nodes for vision
- Display nodes for feedback
- Sensor aggregation

**Phase 3: Hub Installation (P4 Board)**
- Central coordinator
- AI processing
- Fleet management

### Critical Assembly Notes

1. **5V Mandate**
   - Radars (LD2420, RD03) MUST use 5V
   - Will fail/malfunction on 3.3V

2. **I2C Address Conflicts**
   - Set Gravity AI boards to 0x62 and 0x63 via hardware jumpers
   - Default will cause address collision

3. **Thermal Management**
   - ESP32-P4 requires heatsink (400MHz dual-core runs hot)
   - Apply before first power-on

4. **Power Budget**
   - Multiple 5V sensors may exceed USB current (500mA)
   - Use external 5V supply if unstable

5. **Continuity Testing**
   - Multimeter beep test VCC→GND before power-on
   - No beep = good, beep = short circuit

---

## 💻 Phase 4: Firmware & Software (PENDING)

### Available in NotebookLM

1. **Flashing Instructions**
   - Arduino IDE setup
   - Quick Start Guide (5 minutes to first device online)
   - OTA (Over-The-Air) update protocols

2. **Network Configuration**
   - WiFi setup (SSID: "guy-fi")
   - MQTT broker credentials
   - Static IP assignments
   - Traffic management

3. **AI Integration**
   - Anthropic Claude API keys (recommended)
   - OpenAI configuration
   - Google Gemini integration
   - Code blocks for key injection

4. **Hub Dashboard**
   - Web interface at http://192.168.1.100
   - Real-time sensor data
   - AI insights display
   - Camera feeds

### Code Architecture

```
Hub Firmware (ESP32-P4):
  ├── Sensor aggregation
  ├── MQTT client
  ├── AI API client (Anthropic/OpenAI/Gemini)
  ├── Decision engine
  └── Fleet coordinator

Node Firmware (ESP32-S3):
  ├── Local sensor reading
  ├── MQTT publishing
  ├── Display rendering (if applicable)
  └── Camera streaming (if applicable)

Scout Firmware (ESP32-C3):
  ├── Deep sleep management
  ├── Wake-on-motion
  ├── Battery monitoring
  └── Minimal MQTT client
```

---

## 🗺️ Phase 5: Deployment Strategy (PENDING)

### 17-Device Floor Plan

From NotebookLM documentation:

**Living Room (The Social Core)**
- 2× S3 nodes (camera + radar)
- 1× Display node
- **Intent detection:** Predict sitting vs standing vs leaving

**Kitchen**
- 1× S3 node (environmental + radar)
- Motion detection for appliance automation

**Hallways (The Transit Vector)**
- 3× C3 scouts (battery powered)
- **Predictive routing:** Know where user is going before arrival

**Bedrooms**
- 1× P4 Hub (Master Bedroom - central location)
- 2× LD2420 radars (bed presence, door entry)
- Sleep tracking

**Offices**
- 2× S3 nodes (display + sensors)
- Focus mode detection

**Doors/Windows**
- 3× C3 scouts (reed switches)
- Entry/exit logging

### Deployment Philosophy

**"Tripwires" vs "Intent Sensors"**

- **Tripwires:** Hallways, doors (detect movement)
- **Intent Sensors:** Living rooms, offices (understand behavior)

**Predictive Placement:**
- Hallway sensor detects user leaving bedroom
- AI predicts: Kitchen (morning) vs Bathroom (night)
- Preemptively adjusts lighting/temperature

---

## 💰 Cost Analysis

### Component Costs

**Starter Tier ($60-80):**
- 1× ESP32-P4 Hub
- 2× ESP32-C3 Scouts
- 2× Radars
- Basic sensors

**Security Focus ($140-180):**
- 1× P4 Hub
- 4× S3 nodes (cameras)
- 4× C3 scouts
- Door/window sensors

**Full Domination ($300-400):**
- 1× P4 Hub
- 10× S3 nodes
- 6× C3 scouts
- Complete sensor suite

### Operational Costs

**AI API Usage:**
- Anthropic Claude Haiku: ~$1.50/month
- OpenAI GPT-3.5: ~$2-3/month
- Google Gemini: Similar to Claude

**Recommendation:** Claude Haiku for speed + cost efficiency

---

## 🧪 Testing & Validation

### Pre-Flight Checks

1. **Continuity Test**
   - Tool: Multimeter (continuity mode)
   - Test: VCC → GND on every board
   - Pass: Silence | Fail: Beep (short)

2. **Smoke Test**
   - Power on via USB
   - Pass: LEDs illuminate, no smoke
   - Fail: No power or magic blue smoke

3. **I2C Scanner**
   - Tool: I2C Scanner sketch
   - Verify addresses:
     - Light sensor: 0x23 or 0x5C
     - Gravity AI #1: 0x62
     - Gravity AI #2: 0x63

4. **Hub Registration**
   - Flash firmware
   - Open dashboard: http://192.168.1.100
   - Verify nodes appear "Online"
   - Check sensor data updates (every 5 seconds)

5. **Walk Test**
   - Walk hallway → living room
   - Verify C3 scout detects
   - Verify P4 hub logs path
   - Confirm prediction before arrival

---

## 🚀 Production Workflow

### Step-by-Step Process

```
1. ORDER COMPONENTS
   ├── Use BOM from NotebookLM
   ├── Espressif for MCUs
   ├── Hi-Link for radars
   └── DFRobot for Gravity AI

2. DESIGN PCBs (optional)
   ├── Open KiCad schematic templates
   ├── Add component symbols
   ├── Route traces per specs
   └── Export Gerbers

3. ASSEMBLE HARDWARE
   ├── Label all boards (MB-P4-BRAIN, etc.)
   ├── Solder power section first
   ├── Add sensors per pinout tables
   └── Apply thermal management

4. TEST HARDWARE
   ├── Continuity check (no shorts)
   ├── Power-on smoke test
   ├── I2C scanner verification
   └── Sensor reading tests

5. FLASH FIRMWARE
   ├── Query NotebookLM for flashing guide
   ├── Start with C3 scouts (simplest)
   ├── Then S3 nodes
   └── Finally P4 hub

6. CONFIGURE NETWORK
   ├── Set WiFi credentials
   ├── Configure MQTT broker
   ├── Assign static IPs
   └── Test connectivity

7. INTEGRATE AI
   ├── Obtain API keys (Anthropic/OpenAI/Gemini)
   ├── Inject into hub firmware
   ├── Test AI responses
   └── Tune decision engine

8. DEPLOY FLEET
   ├── Follow 17-device floor plan
   ├── Start with high-traffic areas
   ├── Validate coverage
   └── Adjust placement

9. VALIDATE SYSTEM
   ├── Walk test (hallway → room)
   ├── Gesture test (thumbs up commands)
   ├── Predictive test (AI anticipates action)
   └── 24-hour stability test

10. LAUNCH VANGUARD PROGRAM
    ├── Market as exclusive early access
    ├── Offer beta AI features
    └── Collect user feedback
```

---

## 📚 Knowledge Base Locations

### Local Files
```
/Users/kevin/
├── esp32_p4_hub.kicad_sch              # P4 schematic template
├── esp32_s3_watchtower.kicad_sch       # S3 schematic template
├── esp32_c3_scout.kicad_sch            # C3 schematic template
├── KICAD_SETUP_GUIDE.md                # KiCad usage instructions
├── ESP32_PINOUTS_REFERENCE.md          # Complete pinout reference
└── AI_COORDINATOR_ROADMAP.md           # This file
```

### NotebookLM Repository
```
URL: https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e

Key Documents:
├── PIN_CONFIGURATIONS.md               # GPIO mappings
├── YOUR_SENSORS_GUIDE.md               # Wiring diagrams
├── BOARD_GUIDE.md                      # Hardware selection
├── MULTI_DEVICE_DEPLOYMENT.md          # Floor plans
├── AI_SETUP_GUIDE.md                   # API configuration
├── COMPLETE_SENSOR_SYSTEM.ino          # Firmware code
└── VANGUARD_MARKETING.md               # Go-to-market strategy
```

### How to Query NotebookLM

Use the NotebookLM skill to retrieve additional information:

```bash
# Activate NotebookLM skill
python scripts/run.py ask_question.py \
  --question "Your question here" \
  --notebook-url "https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e"
```

**Example Queries:**
- "Show me the firmware flashing instructions"
- "What are the WiFi configuration steps?"
- "Explain the deployment strategy for living room"
- "How do I set up Anthropic Claude API keys?"
- "What is the troubleshooting guide for MQTT connection errors?"

---

## ⚠️ Critical Warnings

### MUST DO

1. **5V for Radars** - LD2420 and RD03 require 5V (will fail on 3.3V)
2. **I2C Addresses** - Set Gravity AI boards to different addresses
3. **Thermal Management** - Heatsink on P4 before power-on
4. **Continuity Test** - Check for shorts before applying power
5. **Power Budget** - External 5V supply if >500mA draw

### MUST NOT DO

1. **Don't Combine** - Camera + large display on same S3 (pin conflict)
2. **Don't Daisy-Chain** - 5V power to hub (dedicated line)
3. **Don't Skip** - Pre-flight checks (shorts will fry boards)
4. **Don't Use** - Standard LDOs on C3 (need low-quiescent like HT7333)
5. **Don't Expect** - Radars to work on 3.3V (will ghost you)

---

## 🎓 Key Concepts for AI Understanding

### 1. Hardware Hierarchy

**P4 "Brain"** → Makes decisions, coordinates fleet
**S3 "Advanced Nodes"** → Heavy processing (camera/display)
**C3 "Scouts"** → Battery-powered sensors (hallways/doors)

### 2. Pin Conflict Resolution

ESP32 chips have limited GPIOs. We avoid conflicts by:
- Using HIGH GPIOs (43, 44) for UART on S3
- Separating I2S (audio) from UART lanes
- Dedicating S3 boards to ONE function (camera OR display, not both)

### 3. Power Architecture

**Two Rails:**
- 5V: Radars, Gravity AI (high-power sensors)
- 3.3V: MCU, logic, I2C sensors (low-power)

**Critical:** Don't mix them up or use wrong voltage

### 4. Deep Sleep Strategy

C3 scouts must conserve battery:
- Active: 80mA (radar scanning)
- Deep sleep: <10µA (99% power savings)
- Wake sources: Motion detection, timer, external interrupt

### 5. Predictive Intelligence

Traditional: "IF motion THEN light on"
Vanguard: "User leaving bedroom at 7AM → Predict: Kitchen → Preheat coffee"

AI analyzes:
- Time of day
- Historical patterns
- Room sequence
- Posture/gesture
- Face identification

---

## 📝 Next Actions

### Immediate (Do Now)

1. ✅ **Review Documentation**
   - Read `ESP32_PINOUTS_REFERENCE.md`
   - Understand hardware architecture
   - Familiarize with pin assignments

2. ⏳ **Order Components**
   - Use BOM from NotebookLM
   - Source ESP32 modules
   - Acquire sensors

3. ⏳ **Retrieve Firmware Guide**
   - Query NotebookLM for flashing instructions
   - Set up Arduino IDE
   - Prepare development environment

### Short-Term (This Week)

1. ⏳ **Design/Order PCBs** (if custom boards)
   - Or use dev boards + breadboards for prototyping

2. ⏳ **Configure Network**
   - Set up WiFi access point
   - Install MQTT broker
   - Plan IP addressing

3. ⏳ **Obtain AI API Keys**
   - Sign up for Anthropic Claude
   - Configure billing
   - Test API access

### Medium-Term (This Month)

1. ⏳ **Assemble First Device** (C3 Scout)
   - Test basic firmware
   - Validate sensor reading
   - Confirm MQTT communication

2. ⏳ **Build S3 Node**
   - Add camera or display
   - Test advanced features
   - Verify performance

3. ⏳ **Deploy P4 Hub**
   - Central coordinator
   - AI integration
   - Fleet management

### Long-Term (This Quarter)

1. ⏳ **Full Fleet Deployment** (17 devices)
2. ⏳ **AI Training & Tuning**
3. ⏳ **User Testing & Validation**
4. ⏳ **Launch Vanguard Program**

---

## 🤝 Collaboration Notes

### For Other AIs Reading This

**Context:** This is a complete smart home system project in production documentation phase.

**What's Done:**
- Hardware design complete
- Pin configurations mapped
- PCB layouts specified
- BOM created
- Assembly instructions written
- KiCad templates generated

**What's Next:**
- Firmware development
- Network setup
- AI integration
- Physical deployment

**Key Resources:**
- NotebookLM contains full technical documentation
- Local Markdown files have quick references
- KiCad files are schematic templates

**How to Help:**
- Query NotebookLM for specific technical details
- Reference pinout tables for wiring questions
- Follow assembly order (C3 → S3 → P4)
- Validate against critical warnings before proceeding

---

## 📞 Support & Resources

### Technical Documentation
- **This Roadmap:** `/Users/kevin/AI_COORDINATOR_ROADMAP.md`
- **Pinouts:** `/Users/kevin/ESP32_PINOUTS_REFERENCE.md`
- **KiCad Setup:** `/Users/kevin/KICAD_SETUP_GUIDE.md`
 - **Recent Updates:** `/Users/kevin/AI_Coordinator_System/docs/ROADMAP_UPDATES.md`

### NotebookLM Integration
- **Notebook:** https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e
- **Skill Location:** `~/.claude/skills/notebooklm/`
- **Query Tool:** `python scripts/run.py ask_question.py`

### External Resources
- **ESP32 Docs:** https://docs.espressif.com/
- **KiCad Documentation:** https://docs.kicad.org/
- **Anthropic Claude:** https://www.anthropic.com/api

---

## ✅ Current Project Status

**Phase Completion:**
- [x] Phase 1: Hardware Design
- [x] Phase 2: Documentation
- [ ] Phase 3: Hardware Assembly
- [ ] Phase 4: Firmware & Software
- [ ] Phase 5: Deployment
- [ ] Phase 6: Production Launch

**Ready For:** Component ordering and assembly

**Blockers:** None - all documentation complete

**Next Milestone:** First C3 Scout powered on and communicating

---

**Document Version:** 1.0
**Last Modified:** December 6, 2025
**Maintained By:** AI Coordinator Project Team
**Status:** Living Document - Update as project progresses
