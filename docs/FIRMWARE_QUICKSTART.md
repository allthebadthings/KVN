# Firmware Quick-Start

- Board: `ESP32-P4`/`ESP32-S3`/`ESP32-C3` (use appropriate core in Arduino IDE)
- IDE: `Arduino IDE` with `esp32` boards package installed
- Connection: USB, select correct serial port

## I2C Scanner

- File: `firmware/i2c_scanner.ino`
- Purpose: Verify I2C device addresses (e.g., `0x23`, `0x62`, `0x63`)
- Steps:
  - Open the sketch in Arduino IDE
  - Select your board (`ESP32 Dev Module` or specific S3/C3 variant)
  - Upload and open `Serial Monitor` at `115200`
  - Optional: set custom pins using `Wire.begin(SDA, SCL)` if not using defaults

## Common Tips

- Power radars with `5V` only
- Perform continuity check before powering boards
- If no devices found:
  - Confirm wiring and pull-ups
  - Try alternative SDA/SCL pins per pinout reference
  - Ensure sensors are powered and share common ground

## Next

- Add basic MQTT heartbeat publisher for C3 scouts
- Add display/camera demo for S3 nodes
