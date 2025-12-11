# ESP32-S3 Display Debug Notes

Field report: the 3.5" Waveshare ESP32‑S3 panel powered up, backlight came on, color fills worked, but **no text ever rendered**. The failure ended up being an I²C wiring mismatch that prevented the TCA9554 expander from ever toggling the LCD reset line.

## Hardware facts that matter

- **LCD reset** is routed through the onboard TCA9554 expander, *not* a bare GPIO.
- Waveshare ties that expander to **SDA = GPIO 8** and **SCL = GPIO 7** on the ESP32‑S3 module.
- If the expander never receives a reset command, the AXS15231B is left in an undefined state where block color writes sometimes work but character drawing never does.

## Code changes that fix it

1. Define the correct I²C pins and reset pin once (`examples/ESP32_S3_35_MQTT_Relay/ESP32_S3_35_MQTT_Relay.ino:41-44`):

   ```cpp
   #define I2C_SDA 8
   #define I2C_SCL 7
   #define TCA_DISPLAY_RESET_PIN 1
   ```

2. Bring the expander up on those pins, configure the reset line, and pulse it before touching the LCD (`ESP32_S3_35_MQTT_Relay.ino:81-88` & `330-355`). The helper functions now:
   - Call `Wire.begin(I2C_SDA, I2C_SCL);`
   - Check `TCA.begin()` and `TCA.pinMode1(...)` return values
   - Issue a proper 1 → 0 → 1 pulse with delays so the panel sees a clean reset

3. Emit Serial warnings when the bus or reset pulse fails so you immediately know if the expander is missing.

## Verification workflow

1. **Upload the sketch** and watch the serial log at 115200 baud.
2. Look for:
   - `Initializing I2C expander on SDA 8 / SCL 7...`
   - Either a warning (bad) or silence (good) before `Initializing display...`
3. On a good boot you will see, in order:
   - Backlight on
   - "TEXT TEST" (red), "Can you see this?" (green), "White text"
   - RED → GREEN → BLUE → BLACK fills
   - Boot/status UI

If the warning prints or colors appear without text, recheck the SDA/SCL jumpers, or run the `examples/Utilities/I2C_Scanner` sketch to confirm the TCA9554 still responds at `0x20`.

## Quick isolation tips

- Use a USB power-only cable? You will never see the logs—always grab a data cable.
- If `TCA9554` doesn't ACK, reseat the display FFC and ensure the 3.3 V line feeding the expander is present.
- Holding BOOT while tapping RESET forces another hardware reset without reflashing—handy for repeated attempts.

Once the expander is alive on GPIO 8/7 the built-in text tests and status screen render exactly as expected.
