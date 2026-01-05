# LAFVIN ESP32-S3 AI Chatbot

This project transforms your ESP32-S3 kit into an AI Chatbot using a Client-Server architecture.
The ESP32 handles Audio Input/Output, while a Python backend runs the AI pipeline (STT -> LLM -> TTS).

## Project Structure

*   `src/`: ESP32 Firmware (C++ / Arduino)
    *   `main.cpp`: Main logic.
    *   `config.h`: Configuration (WiFi, Pins, IP).
*   `backend/`: Python Server
    *   `server.py`: Flask application.
    *   `requirements.txt`: Python dependencies.

## Hardware Requirements

*   ESP32-S3 Board (LAFVIN Kit)
*   I2S Microphone (e.g., INMP441)
*   I2S Amplifier/Speaker (e.g., MAX98357A)
*   Button (Boot button or external)

## Setup Guide

### 1. Backend Setup (Computer)

1.  **Install Python Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
2.  **Install & Run Ollama (LLM):**
    *   Download from [ollama.com](https://ollama.com).
    *   Run the model:
        ```bash
        ollama run tinyllama
        ```
    *   Ensure Ollama is running in the background.

3.  **Start the Server:**
    ```bash
    python server.py
    ```
    *   Note your computer's IP address (e.g., `192.168.1.100`).

### 2. Firmware Setup (ESP32)

1.  **Configure:**
    *   Open `include/config.h`.
    *   Update `WIFI_SSID` and `WIFI_PASSWORD`.
    *   Update `SERVER_IP` to your computer's IP address.
    *   **Verify Pins:** Check `I2S_MIC_*` and `I2S_SPK_*` definitions against your kit's pinout.

2.  **Upload:**
    *   Connect ESP32 via USB.
    *   Run upload command (or use VS Code PlatformIO extension):
        ```bash
        pio run -t upload
        pio device monitor
        ```

## Usage

1.  Hold the **BOOT Button** (or configured button).
2.  Speak into the microphone.
3.  Release the button to send audio.
4.  The ESP32 will receive the AI response and play it through the speaker.

## Troubleshooting

*   **Audio is static/noise:** Check I2S pin connections in `config.h`.
*   **Connection Failed:** Ensure Computer and ESP32 are on the *same WiFi network* and firewall allows port 5000.
*   **Ollama Error:** Make sure `ollama serve` is running.

## Testing
Run the backend test to verify the server:
```bash
python backend/test_server.py
```
