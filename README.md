# Kinetic Vector Network (KVN)

**Smart Home AI System with ESP32 Devices**

An advanced smart home system using ESP32 microcontrollers with AI-powered automation and real-time monitoring.

**Website:** [kvn.ltd](https://kvn.ltd)

## System Overview

- **1× ESP32-P4 Hub** - Central processing hub ("The Brain")
- **10× ESP32-S3 Nodes** - Advanced sensors, cameras, displays
- **6× ESP32-C3 Scouts** - Battery-powered sensors for hallways/windows
- **1× ESP32-C6 MQTT Relay** - Dedicated message relay with status display
- **AI Integration** - Anthropic Claude / OpenAI / Google Gemini
- **Communication** - MQTT + WebSocket real-time protocol
- **Interfaces** - Web Dashboard + Flutter Mobile App (Vanguard)

## Project Structure

```
KVN_Coordinator_System/
├── README.md                               # This file
├── AI_COORDINATOR_DOCUMENTATION_INDEX.md   # Complete documentation index
├── .gitignore
├── .env.example                            # Environment template
│
├── docs/                                   # Documentation
│   ├── AI_COORDINATOR_ROADMAP.md           # Master roadmap
│   ├── ESP32_PINOUTS_REFERENCE.md          # Hardware pinouts
│   ├── ESP32_C6_MQTT_RELAY.md              # MQTT Relay documentation
│   ├── FIRMWARE_FILE_STRUCTURE.md          # Firmware organization
│   ├── FIRMWARE_QUICKSTART.md              # Quick start guide
│   ├── KICAD_SETUP_GUIDE.md                # PCB design guide
│   ├── NETWORK_CONFIG_GUIDE.md             # Network/API config
│   ├── ESP32_P4_Web_Dashboard_*.md         # Dashboard specs
│   ├── Flutter_Mobile_App_*.md             # Mobile app specs
│   └── ...
│
├── prompts/                                # AI Agent Instructions
│   ├── TRAE_CODE_REVIEW.md                 # Code review agent
│   └── TRAE_WEBAPP_AGENT_PROMPT.md         # Web/app dev agent
│
├── hardware/                               # Hardware Design Files
│   ├── esp32_c3_scout.kicad_sch            # C3 Scout schematic
│   ├── esp32_p4_hub.kicad_sch              # P4 Hub schematic
│   ├── esp32_s3_watchtower.kicad_sch       # S3 Node schematic
│   └── fp-info-cache                       # KiCad footprint cache
│
├── examples/                               # Firmware Examples
│   ├── Complete_Sensor_System/             # ESP32-P4 firmware
│   ├── ESP32_C3_Simple_Node/               # ESP32-C3 firmware
│   ├── ESP32_C6_MQTT_Relay/                # ESP32-C6 MQTT relay
│   └── Utilities/                          # Utility sketches
│
├── vanguard_app/                           # Flutter Mobile App
│   ├── lib/                                # Dart source code
│   ├── android/                            # Android build
│   ├── ios/                                # iOS build
│   └── assets/                             # Images, fonts
│
├── vanguard_dashboard/                     # Web Dashboard
│   └── data/www/                           # HTML/CSS/JS files
│
├── venv/                                   # Python virtual environment
│
├── AGENTS.md -> Workspace/Docs/AGENTS.md   # Agent guidelines (symlink)
├── AI KEYS -> Documents/.../AI KEYS        # API keys (symlink)
├── ROADMAP.md -> Workspace/Docs/ROADMAP.md # Project roadmap (symlink)
└── aicoordinator.pdf                       # System overview PDF
```

## Quick Start

### 1. Read the Documentation

Start with the complete documentation index:

```bash
cat AI_COORDINATOR_DOCUMENTATION_INDEX.md
```

### 2. Set Up Your Environment

**Hardware Developers:**
- Review `docs/ESP32_PINOUTS_REFERENCE.md`
- Check `docs/KICAD_SETUP_GUIDE.md`

**Firmware Developers:**
- Review `docs/FIRMWARE_FILE_STRUCTURE.md`
- Set up Arduino IDE with ESP32 support
- Create `secrets.h` from template

**Web/App Developers:**
- Review `prompts/TRAE_WEBAPP_AGENT_PROMPT.md`
- Check `docs/ESP32_P4_Web_Dashboard_PRD.md`
- Check `docs/Flutter_Mobile_App_PRD.md`

### 3. Configure Network & APIs

See `docs/NETWORK_CONFIG_GUIDE.md` for:
- WiFi configuration
- MQTT broker setup
- AI API keys (Anthropic/OpenAI/Gemini)

## Current Status

- ✅ **Phase 1:** System Architecture Design - Complete
- ✅ **Phase 2:** Hardware Design & Documentation - Complete
- 🟡 **Phase 3:** Firmware & Software Development - In Progress
- ⬜ **Phase 4:** Integration & Testing
- ⬜ **Phase 5:** Deployment & Production

## Key Features

### Hardware
- 18 networked ESP32 devices (P4, S3, C3, C6)
- Cameras, displays, mmWave radars, environmental sensors
- Dedicated MQTT relay with real-time status monitoring
- Low-power battery operation for scouts
- Custom PCB designs

### Software
- Real-time MQTT communication
- AI-powered automation and insights
- WebSocket-based web dashboard
- Cross-platform Flutter mobile app (Vanguard)
- Push notifications and alerts

### AI Integration
- Natural language automation rules
- Predictive insights and recommendations
- Multi-provider support (Claude, GPT, Gemini)
- Cost-optimized with Haiku/Mini models (~$0.03/day)

## Documentation Index

For complete documentation, API references, and development guides, see:

**[AI_COORDINATOR_DOCUMENTATION_INDEX.md](AI_COORDINATOR_DOCUMENTATION_INDEX.md)**

## Resources

### Official ESP32 Documentation
- [ESP32-P4](https://www.espressif.com/en/products/socs/esp32-p4)
- [ESP32-S3](https://www.espressif.com/en/products/socs/esp32-s3)
- [ESP32-C3](https://www.espressif.com/en/products/socs/esp32-c3)
- [ESP32-C6](https://www.espressif.com/en/products/socs/esp32-c6)

### Development Tools
- Arduino IDE with ESP32 board support
- KiCad for PCB design
- Flutter for mobile app
- Vue.js/Alpine.js for web dashboard

### AI Providers
- [Anthropic Claude](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Google Gemini](https://ai.google.dev/docs)

## Critical Warnings

⚠️ **Hardware:**
- mmWave radars require 5V (NOT 3.3V!)
- ESP32-P4 requires heatsink
- I2C needs 4.7kΩ pull-up resistors

⚠️ **Firmware:**
- Enable PSRAM for camera nodes
- C3 has limited GPIOs - plan carefully
- Static IP required for P4 Hub

⚠️ **Security:**
- Never commit API keys or secrets
- Use `.env` files for sensitive data
- Enable encryption for production

## Contributing

This is a personal project, but documentation and code reviews are welcome.

See `prompts/TRAE_CODE_REVIEW.md` for code review guidelines.

## License

Private project - All rights reserved

---

**Kinetic Vector Network** - Intelligent motion through coordinated sensing

**Questions?** Check the [Documentation Index](AI_COORDINATOR_DOCUMENTATION_INDEX.md) or query the [NotebookLM Knowledge Base](https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e).
