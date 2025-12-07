# AI Coordinator Roadmap – Recent Updates

- Last Updated: 2025-12-07
- Scope: Additions aligned with firmware setup and configuration in the roadmap

## Summary of Changes

- Added `firmware/i2c_scanner.ino` to verify I2C device addresses
- Added `firmware/README.md` with Arduino setup and usage notes
- Added `.env.example` containing AI provider keys and network settings

## File Locations

- `firmware/i2c_scanner.ino`
- `firmware/README.md`
- `.env.example`

## Usage Notes

- I2C Scanner
  - Open `firmware/i2c_scanner.ino` in Arduino IDE
  - Select the appropriate ESP32 board
  - Upload and use `Serial Monitor` at `115200`
  - Use `Wire.begin(SDA, SCL)` if non-default pins are required

- Environment Configuration
  - Copy `.env.example` to `.env`
  - Populate `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`
  - Set `WIFI_SSID`, `MQTT_BROKER_URL`, and optional credentials

## Roadmap Cross-References

- Firmware flashing and OTA: `AI_COORDINATOR_ROADMAP.md:196-200`
- Network configuration (WiFi/MQTT/IP): `AI_COORDINATOR_ROADMAP.md:201-206`
- Hub dashboard: `AI_COORDINATOR_ROADMAP.md:214-218`
- AI integration keys and clients: `AI_COORDINATOR_ROADMAP.md:208-213`
- I2C address verification: `AI_COORDINATOR_ROADMAP.md:338-343`
- Critical voltage/power rules: `AI_COORDINATOR_ROADMAP.md:170-185`, `472-481`
- Pin conflict guidance: `AI_COORDINATOR_ROADMAP.md:500-506`, `484-485`

## Recommended Next Steps

- Implement MQTT heartbeat for C3 scouts (publish status to broker)
- Create single-function S3 demo (camera or display)
- Stub hub dashboard at `HUB_DASHBOARD_URL` to show live MQTT data
