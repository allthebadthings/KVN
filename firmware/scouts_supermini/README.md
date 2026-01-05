# ESP32-C3 SuperMini Scout

A tailored configuration for the ESP32-C3 SuperMini board, using a custom pinout defined in `config-esp32-c3-supermini.json`.

## Hardware Pinout

| Function | KVN Role | Pin | JSON Key |
|----------|----------|-----|----------|
| **UART RX** | Radar Input | **20** | `uart-rx` |
| **UART TX** | Radar Output | **21** | `uart-tx` |
| **I2C SDA** | Primary Sensors | **8** | `i2c-sda` |
| **I2C SCL** | Primary Sensors | **9** | `i2c-scl` |
| **Aux SDA** | Secondary Sensors | **3** | `SDA` |
| **Aux SCL** | Secondary Sensors | **4** | `SCL` |
| **GPIO 2** | Status LED | **2** | `out-gpio` |

## Features

- **Dual I2C Bus:** Scans both `SensorBus` (8/9) and `AuxBus` (3/4) for devices.
- **Radar Ready:** UART1 initialized on pins 20/21 for radar communication.
- **Heartbeat:** Status LED on GPIO 2 blinks every 10 seconds.
- **Auto-Discovery:** Publishes found I2C addresses to `vanguard/scout/<id>/discovery`.

## Setup
1. **Flash:** Use `ESP32C3 Dev Module`.
2. **Secrets:** Define WiFi/MQTT in `../secrets.h`.
3. **Power:** 5V via USB or 3.3V pin (regulated).
