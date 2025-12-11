# LDR Auto-Brightness Wiring Guide

## Components Needed

- 1× 5528 LDR (Light Dependent Resistor)
- 1× 10kΩ resistor
- Jumper wires or soldering

## Circuit Diagram

```
ESP32-C6-LCD-1.47 Board
┌──────────────────────────┐
│                          │
│  3.3V ─────┬─────────────┤
│            │             │
│         ┌──┴──┐          │
│         │ LDR │ 5528     │
│         └──┬──┘          │
│            │             │
│            ├─────────────┤ GPIO 0 (ADC)
│            │             │
│         ┌──┴──┐          │
│         │10kΩ │          │
│         └──┬──┘          │
│            │             │
│  GND ──────┴─────────────┤
│                          │
└──────────────────────────┘
```

## Wiring Steps

### Option 1: Breadboard (Testing)

1. **3.3V to LDR:** Connect 3.3V pin to one leg of the LDR
2. **LDR to GPIO 0:** Connect other LDR leg to GPIO 0 pin header
3. **GPIO 0 to Resistor:** Connect 10kΩ resistor from GPIO 0 to GND
4. **GND connection:** Connect GND pin

### Option 2: Direct Soldering (Permanent)

The ESP32-C6-LCD-1.47 has GPIO pins on the header:

```
Pin Header (looking at board):
┌────────────────────┐
│ GND  [ ]           │
│ 3V3  [ ]           │
│ IO0  [ ] ← Connect LDR junction here
│ IO1  [ ]           │
│ IO2  [ ]           │
│  ...                │
```

**Solder Points:**
1. Solder one LDR leg to **3.3V pad**
2. Solder other LDR leg + 10kΩ resistor leg to **GPIO 0 pad**
3. Solder other resistor leg to **GND pad**

## How It Works

### Voltage Divider Principle

```
3.3V ──┬── LDR (variable resistance)
       │
       ├───► GPIO 0 reads voltage here
       │
       └── 10kΩ (fixed resistance)
       │
      GND
```

**In Bright Light:**
- LDR resistance: ~1-2kΩ (low)
- Voltage at GPIO 0: ~2.5-3.0V
- ADC reads: ~3000-3700 (out of 4095)
- Display brightness: **HIGH**

**In Darkness:**
- LDR resistance: ~20-100kΩ (high)
- Voltage at GPIO 0: ~0.3-1.0V
- ADC reads: ~400-1200
- Display brightness: **LOW** (30/255 minimum)

## Testing

1. **Upload the firmware** with `AUTO_BRIGHTNESS true`
2. **Open Serial Monitor** (115200 baud)
3. **Watch the output** every 5 seconds:
   ```
   LDR: 2847 → Brightness: 178 → Adjusted: 156
   ```
4. **Cover the LDR** with your hand → brightness should drop
5. **Shine a light** on LDR → brightness should increase

## Calibration

If auto-brightness is too aggressive or not responsive enough, adjust these values in the `.ino` file:

```cpp
// Adjust these based on your lighting conditions
#define LDR_MIN_BRIGHTNESS 30   // Increase if too dim in dark
#define LDR_MAX_BRIGHTNESS 255  // Decrease if too bright in light

// In updateBacklight() function:
int brightness = map(ldrValue, 500, 3500, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);
//                              ^^^^  ^^^^
//                              Adjust these thresholds based on Serial Monitor output
```

### Finding Your Thresholds

1. Open Serial Monitor
2. Note LDR value in **darkest** room condition (e.g., 600)
3. Note LDR value in **brightest** room condition (e.g., 3200)
4. Update the `map()` function:
   ```cpp
   int brightness = map(ldrValue, 600, 3200, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);
   ```

## Disable Auto-Brightness

To turn off auto-brightness and use fixed brightness:

```cpp
#define AUTO_BRIGHTNESS false  // Change to false
#define BACKLIGHT_LEVEL 150    // Set your preferred brightness (0-255)
```

## Troubleshooting

### Display Always Dim
- Check LDR is connected to 3.3V (not GND)
- Verify GPIO 0 connection
- Check Serial Monitor - LDR value should be > 1000 in normal light

### Display Always Bright
- Check 10kΩ resistor is connected to GND
- LDR might be damaged - try another one
- Check Serial Monitor - LDR value should change when covered

### Erratic Behavior
- Use shorter wires (< 10cm)
- Add 0.1µF capacitor between GPIO 0 and GND (noise filtering)
- Shield LDR from direct LED backlight reflection

## Advanced: Smoothing

For smoother transitions, add exponential smoothing:

```cpp
void updateBacklight() {
    static int smoothedBrightness = BACKLIGHT_LEVEL;

    // ... existing code to read ldrValue ...

    // Exponential smoothing (alpha = 0.1)
    smoothedBrightness = (0.1 * adjusted) + (0.9 * smoothedBrightness);
    analogWrite(TFT_BL_PIN, smoothedBrightness);
}
```

## Component Specifications

### 5528 LDR
- **Resistance (dark):** 20kΩ - 100kΩ
- **Resistance (10 lux):** 8-20kΩ
- **Resistance (100 lux):** 1-2kΩ
- **Peak wavelength:** 540nm (green)
- **Max voltage:** 150V DC
- **Max power:** 100mW

### 10kΩ Resistor
- **Tolerance:** ±5% (brown-black-orange-gold)
- **Power rating:** 1/4W minimum
- **Type:** Carbon film or metal film

## Cost Analysis

| Component | Quantity | Cost |
|-----------|----------|------|
| 5528 LDR | 100pcs | $6.99 |
| 10kΩ resistor | 1pc | $0.01 |
| **Cost per relay** | | **$0.08** |

Adding auto-brightness costs less than 10 cents per device!

## Benefits

✅ **Power savings** - Display dims at night (saves ~50mA)
✅ **Eye comfort** - No blinding bright screen in dark rooms
✅ **Professional** - Automatic adaptation like smartphones
✅ **Simple** - Only 2 components

---

**Questions?** Check the main [MQTT Relay README](README.md)
