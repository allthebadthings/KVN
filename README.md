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
├── README.md
├── .env.example
│
├── apps/
│   ├── vanguard_app/           # Flutter mobile app (iOS + Android)
│   └── dashboard/              # Web dashboard (HTML/CSS/JS)
│
├── firmware/
│   ├── hub/                    # ESP32-P4 Hub firmware
│   ├── hub_ldr/                # P4 Hub with LDR support
│   ├── nodes_advanced/         # ESP32-S3 advanced node
│   ├── nodes_watchtower/       # S3 watchtower with LDR
│   ├── nodes_35_relay/         # S3 3.5" display MQTT relay
│   ├── scouts_simple/          # ESP32-C3 simple node
│   ├── scouts_ldr/             # C3 scout with LDR
│   ├── scouts_supermini/       # C3 SuperMini scout
│   ├── relay/                  # ESP32-C6 MQTT relay
│   ├── relay_2432s028/         # 2432S028 display relay
│   ├── relay_2432s028_tft/     # 2432S028 with TFT_eSPI
│   ├── utilities/              # I2C scanner, test sketches
│   └── secrets.h               # WiFi/API credentials (gitignored)
│
├── hardware/
│   ├── esp32_p4_hub.kicad_sch
│   ├── esp32_s3_watchtower.kicad_sch
│   └── esp32_c3_scout.kicad_sch
│
├── libraries/
│   ├── ESP32_AI/               # AI integration library
│   └── KVN_LDR/                # Light-dependent resistor library
│
├── docs/                       # All documentation
│
└── Demos/                      # Vendor demos & archived experiments
```

## Quick Start

1. **Read docs:** `docs/FIRMWARE_QUICKSTART.md`
2. **Copy secrets template:** `cp firmware/secrets.h.example firmware/secrets.h`
3. **Flash order:** C3 Scouts → S3 Nodes → P4 Hub

## Documentation

See `docs/` folder:
- `FIRMWARE_QUICKSTART.md` - Getting started
- `ESP32_PINOUTS_REFERENCE.md` - Hardware pinouts
- `NETWORK_CONFIG_GUIDE.md` - WiFi/MQTT/API setup
- `KICAD_SETUP_GUIDE.md` - PCB design

Full index: [AI_COORDINATOR_DOCUMENTATION_INDEX.md](AI_COORDINATOR_DOCUMENTATION_INDEX.md)

## Current Status

- ✅ Phase 1: System Architecture Design
- ✅ Phase 2: Hardware Design & Documentation
- 🟡 Phase 3: Firmware & Software Development
- ⬜ Phase 4: Integration & Testing
- ⬜ Phase 5: Deployment & Production

## Critical Warnings

⚠️ mmWave radars require **5V** (not 3.3V)  
⚠️ ESP32-P4 requires heatsink  
⚠️ Enable PSRAM for camera nodes  
⚠️ Never commit `secrets.h`

---

**Kinetic Vector Network** - Intelligent motion through coordinated sensing
