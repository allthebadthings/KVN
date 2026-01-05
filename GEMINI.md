# GEMINI.md - KVN Coordinator System

## Project Overview

The KVN (Kinetic Vector Network) Coordinator System is an advanced, AI-powered smart home project. It utilizes a network of 18 ESP32 devices to provide real-time monitoring and intelligent automation. The system is designed to be controlled and monitored via a web dashboard and a cross-platform mobile app.

**Core Technologies:**

*   **Hardware:**
    *   **ESP32-P4 Hub:** The central processing unit of the system.
    *   **ESP32-S3 Nodes:** Used for advanced sensing, including cameras and displays.
    *   **ESP32-C3 Scouts:** Low-power, battery-operated sensors.
    *   **ESP32-C6 Relay:** A dedicated MQTT message relay.
*   **Software:**
    *   **Firmware:** Written in C++/Arduino.
    *   **Web Dashboard:** Built with Vue.js/Alpine.js and served directly from the ESP32-P4 Hub.
    *   **Mobile App (Vanguard):** A cross-platform application built with Flutter for iOS and Android.
*   **Communication:**
    *   **MQTT:** The primary protocol for device-to-device communication.
    *   **WebSockets:** Used for real-time updates to the web dashboard.
*   **AI Integration:**
    *   The system is designed to work with multiple AI providers, including Anthropic Claude, OpenAI, and Google Gemini.
    *   AI is used for tasks like natural language automation, predictive insights, and code review.

## Building and Running

The project is divided into three main development areas: hardware, firmware, and software (web/mobile).

### Hardware

*   **Design Files:** KiCad is used for PCB design. Schematic files are available in the `hardware/` directory.
*   **Pinouts:** A complete pinout reference for all boards can be found in `docs/ESP32_PINOUTS_REFERENCE.md`.
*   **Setup Guide:** For information on working with the KiCad files, refer to `docs/KICAD_SETUP_GUIDE.md`.

### Firmware

*   **IDE:** The Arduino IDE is used for firmware development.
*   **File Structure:** The firmware is organized into a main `libraries/` directory and an `examples/` directory containing the code for each ESP32 variant. The complete file structure is documented in `docs/FIRMWARE_FILE_STRUCTURE.md`.
*   **Dependencies:**
    *   `AsyncWebServer`
    *   `PubSubClient` (for MQTT)
    *   `ArduinoJson`
    *   `TFT_eSPI`
*   **Configuration:**
    1.  Create a `secrets.h` file in the appropriate firmware directory.
    2.  Add your WiFi credentials, MQTT broker details, and AI API keys to this file.
*   **Building and Flashing:**
    1.  Open the appropriate `.ino` file from the `examples/` directory in the Arduino IDE.
    2.  Select the correct ESP32 board from the "Tools" menu.
    3.  Compile and upload the firmware to the device.

### Software (Web & Mobile)

#### Web Dashboard

*   **Frameworks:** The dashboard uses a combination of Vue.js (Petite) and Alpine.js.
*   **Development:**
    1.  The dashboard files are located in `vanguard_dashboard/data/www/`.
    2.  Development instructions and component breakdowns are in `docs/ESP32_P4_Web_Dashboard_PRD.md`.
*   **Running:** The web dashboard is served directly from the ESP32-P4 Hub at `http://192.168.1.100`.

#### Mobile App (Vanguard)

*   **Framework:** The mobile app is built with Flutter.
*   **Source Code:** The app's source code is in the `vanguard_app/` directory.
*   **Development:**
    1.  Set up your Flutter development environment.
    2.  Open the `vanguard_app/` directory in your IDE.
    3.  Run the app on an emulator or a physical device.
*   **Development Guide:** The agent prompt for web and app development is `prompts/TRAE_WEBAPP_AGENT_PROMPT.md`.

## Development Conventions

*   **Secrets Management:** Never commit API keys, passwords, or other secrets to the repository. Use a `secrets.h` file for firmware or a `.env` file for other development, and ensure these are listed in the `.gitignore` file.
*   **Code Style:**
    *   The project encourages the use of an AI agent (TRAE) for code review. The agent's instructions are in `prompts/TRAE_CODE_REVIEW.md`.
    *   While no specific style guide is mentioned, the existing code should be used as a reference.
*   **Documentation:**
    *   The project has a comprehensive set of documentation in the `docs/` directory.
    *   The `AI_COORDINATOR_DOCUMENTATION_INDEX.md` file serves as the central index for all documentation.
*   **Contribution:** This is a personal project, but documentation and code reviews are welcome.
