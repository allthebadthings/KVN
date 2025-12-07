# ESP32 AI Coordinator System - Production Reference

## ESP32-P4 Hub ("The Brain")

### Power Section
- 5V from USB-C for Radars
- 3.3V from LDO for MCU and logic

### UART Connections
- **GPIO16/17:** LD2420 #1 (Bed)
- **GPIO18/19:** LD2420 #2 (Door)
- **GPIO26:** RD03-EG521 (Zone)
- **GPIO33:** RD03-DG521 (Intent)

### I2C Bus (GPIO21/22)
- BH1750 Light Sensor
- Gravity AI #1 (Address: 0x62)
- Gravity AI #2 (Address: 0x63)
- **Pull-ups:** 4.7kΩ to 3.3V

### I2S Audio (GPIO25/32/34)
- INMP441 Microphone

### Critical Notes
- ⚠️ All radars require 5V power
- ⚠️ I2C pull-ups: 4.7kΩ to 3.3V
- ⚠️ Decoupling: 100nF at each sensor
- ⚠️ Thermal: Heatsink REQUIRED on P4

### Power Regulation
```
USB-C → TVS Diode → GND (ESD Protection)
USB-C → 470µF → 5V Rail (Radar Power)
USB-C → LDO (>800mA) → 3.3V Rail
  LDO Input:  10µF + 100nF
  LDO Output: 10µF + 100nF
```

### Sensor Connectors

**J1 - LD2420 #1 (Bed Radar):**
1. 5V
2. GND
3. TX → GPIO16 (RX)
4. RX → GPIO17 (TX)

**J2 - LD2420 #2 (Door Radar):**
1. 5V
2. GND
3. TX → GPIO18 (RX)
4. RX → GPIO19 (TX)

**J3 - RD03-EG521:**
1. 5V
2. GND
3. TX → GPIO26 (RX)

**J4 - RD03-DG521:**
1. 5V
2. GND
3. RX → GPIO33 (TX)

**J5 - I2C Bus (Light + Gravity AI):**
1. VCC (3.3V or 5V)
2. GND
3. SDA → GPIO21 (+ 4.7kΩ pullup)
4. SCL → GPIO22 (+ 4.7kΩ pullup)

**J6 - INMP441 Microphone:**
1. 3.3V
2. GND
3. WS → GPIO25
4. SCK → GPIO32
5. SD → GPIO34
6. L/R → GND

### Component Values

**Power:**
- C1: 470µF Electrolytic (5V rail smoothing)
- C2, C3: 10µF Ceramic (LDO input/output)
- C4, C5: 100nF Ceramic (LDO filtering)
- U1: LDO Regulator (3.3V, >800mA)
- D1: TVS Diode (ESD protection)

**I2C Pull-ups:**
- R1, R2: 4.7kΩ (SDA, SCL)

**Decoupling (one per sensor):**
- C6-C12: 100nF Ceramic

**Thermal:**
- Heatsink for ESP32-P4 (MANDATORY)

---

## ESP32-S3 Watchtower (Display + Radar)

### Configuration
- Visual output: TFT Display (SPI)
- Sensor input: Radar (UART)
- ⚠️ DO NOT combine camera + large display (pin conflict)

### Best Deployment
- Living rooms
- Offices
- Control stations

### Power Section
```
5V Input → LDO → 3.3V
  Input filtering:  10µF + 100nF
  Output filtering: 10µF + 100nF

Radar Power: 5V direct
Display Backlight: 5V via Ferrite Bead (reduces noise)
```

### Pin Assignment

**SPI Display (ILI9341/ILI9488):**
- GPIO4 → CS (Chip Select)
- GPIO5 → DC (Data/Command)
- GPIO6 → RST (Reset)
- GPIO7 → MOSI (Data)
- GPIO8 → CLK (Clock)
- 5V + Ferrite → LED+ (Backlight)

**UART Radar (RD03-DG521):**
- GPIO43 → TX (High GPIO avoids I2S conflict)
- GPIO44 → RX (High GPIO avoids I2S conflict)

**I2C Sensors (Optional):**
- GPIO9 → SDA (+ 4.7kΩ → 3.3V)
- GPIO10 → SCL (+ 4.7kΩ → 3.3V)

### Connectors

**J1 - TFT Display (SPI):**
1. VCC (3.3V or 5V - check display)
2. GND
3. CS ← GPIO4
4. RST ← GPIO6
5. DC ← GPIO5
6. MOSI ← GPIO7
7. CLK ← GPIO8
8. LED+ ← 5V via Ferrite Bead

**J2 - RD03 Radar:**
1. 5V
2. GND
3. TX → GPIO44 (S3 RX)
4. RX → GPIO43 (S3 TX)

**J3 - I2C Expansion (Optional):**
1. 3.3V
2. GND
3. SDA → GPIO9
4. SCL → GPIO10

### Component Values

**Power:**
- U1: LDO Regulator (3.3V, >500mA)
- C1, C2: 10µF Ceramic (LDO input)
- C3, C4: 10µF + 100nF (LDO output)
- FB1: Ferrite Bead (Display backlight noise filter)

**I2C Pull-ups (if using I2C):**
- R1, R2: 4.7kΩ (SDA, SCL)

**Decoupling:**
- C5-C7: 100nF Ceramic (one per device)

### ⚠️ Critical Notes

1. **UART PIN SELECTION:**
   - Use HIGH GPIOs (43, 44) for radar
   - Avoids I2S conflict on default pins

2. **DISPLAY NOISE:**
   - Ferrite bead on backlight power MANDATORY
   - Prevents display noise in radar data
   - Use "teardrop" pads on FPC connector

3. **POWER STABILITY:**
   - Radar requires clean 5V
   - DO NOT daisy-chain through 3.3V regulator
   - Direct 5V trace from power input

4. **AVOID PIN CONFLICT:**
   - Do NOT add camera to this config
   - Do NOT add large 7" display
   - S3 has limited GPIOs - one function at a time

5. **PCB LAYOUT:**
   - Keep display traces away from antenna
   - No copper under antenna area
   - Display connector on board edge

---

## ESP32-C3 Scout ("The Infiltrator")

### Mission
- Battery powered (Li-Ion 3.7-4.2V)
- Ultra-low power (deep sleep)
- Compact (22mm max width)
- Hallway/junction box deployment

### Battery Management
```
Li-Ion Battery (3.7-4.2V)
  ↓
HT7333 Low-IQ LDO (<4µA quiescent)
  Input:  10µF
  Output: 10µF → 3.3V
  ↓
ESP32-C3 + Sensors

Battery Voltage Monitor:
V_BAT → 100kΩ → Junction → 100kΩ → GND
              ↓
         GPIO3 (ADC)

Formula: V_actual = V_adc × 2
```

### Pin Assignment

**Power Control:**
- GPIO8 → 2N7000 Gate (Sensor power switch)

**UART Radar (ONE sensor max):**
- GPIO6 → RX (← Radar TX)
- GPIO7 → TX (→ Radar RX)

**I2C Sensors (Unlimited chaining):**
- GPIO4 → SDA (+ 4.7kΩ → 3.3V)
- GPIO5 → SCL (+ 4.7kΩ → 3.3V)

**Digital Input:**
- GPIO3 → Reed Switch / PIR Motion (also battery ADC)

**Boot Pin:**
- GPIO2 → AVOID / LED only (keep clear for boot stability)

### Sensor Power Switching

**Circuit:**
```
┌────────┐
│ Sensor │
│  VCC   │ ← 3.3V Always On
│  GND   │ ← Switchable via MOSFET
└───┬────┘
    │
[2N7000 Drain]
    │
[2N7000 Source] ← GND
    │
Gate ← GPIO8

Operation:
- GPIO8 HIGH → MOSFET ON → Sensor powered
- GPIO8 LOW → MOSFET OFF → Sensor off (saves power)
```

### Connectors

**J1 - Li-Ion Battery:**
1. BAT+ (3.7-4.2V)
2. BAT- (GND)

**J2 - Radar (LD2420 or RD03):**
1. 3.3V
2. GND (via MOSFET switch)
3. TX → GPIO6 (C3 RX)
4. RX → GPIO7 (C3 TX)

**J3 - I2C Sensors:**
1. 3.3V
2. GND
3. SDA → GPIO4
4. SCL → GPIO5

**J4 - Door/Window Sensor:**
1. GPIO3
2. GND (Reed switch: NO contact)

### Component Values

**Power Management:**
- U1: HT7333 LDO (3.3V, Low-IQ <4µA)
- C1: 10µF Ceramic (LDO input)
- C2: 10µF Ceramic (LDO output)
- BT1: Li-Ion 18650 or LiPo cell

**Battery Monitor:**
- R1, R2: 100kΩ (Voltage divider - high resistance = low leakage)

**Sensor Power Switch:**
- Q1: 2N7000 N-Channel MOSFET (logic-level gate)

**I2C Pull-ups:**
- R3, R4: 4.7kΩ (SDA, SCL)

**Decoupling:**
- C3-C5: 100nF Ceramic

### ⚠️ Critical Notes

1. **LOW-QUIESCENT LDO MANDATORY:**
   - Standard LDOs drain battery even in sleep
   - HT7333 or equivalent (<10µA quiescent)
   - DO NOT use AMS1117/LM1117

2. **GPIO LIMITATIONS:**
   - C3 has VERY limited GPIOs
   - Can run ONE UART sensor OR I2C chain
   - Cannot run multiple UART sensors

3. **BATTERY MONITORING:**
   - 100kΩ resistors minimize leakage
   - Lower values drain battery faster
   - GPIO3 reads 50% of actual voltage

4. **MOSFET PLACEMENT:**
   - Switch on GROUND side (low-side switch)
   - Add 10kΩ gate resistor (not shown)
   - Prevents floating gate during C3 reset

5. **DEEP SLEEP WAKE-UP:**
   - Route radar OUT pin to RTC GPIO
   - C3 wakes only when target detected
   - Critical for battery life

6. **BOOT PIN (GPIO2):**
   - Keep clear for boot stability
   - Can use for LED indicator only
   - Do NOT use for critical sensors

7. **PHYSICAL SIZE:**
   - Max width: 22mm (stick form)
   - Fits standard junction boxes
   - 2-layer PCB acceptable

### Deep Sleep Strategy

**Power Consumption Targets:**
- Active (radar scanning): ~80mA
- Light sleep: ~800µA
- Deep sleep: <10µA

**Battery Life (18650 3000mAh):**
- Continuous active: ~37 hours
- 95% deep sleep: ~3-6 months

**Wake Sources:**
- Radar detection (via RTC GPIO)
- Timer wake (hourly check-in)
- External interrupt (reed switch)

---

**Use this as your build reference!**
