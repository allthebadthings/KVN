// TFT_eSPI User Setup for Waveshare ESP32-C6-LCD-1.47
// Copy this file to: Arduino/libraries/TFT_eSPI/User_Setup.h
// Or use User_Setup_Select.h to include this file

#define ST7789_DRIVER      // Display driver for ST7789

#define TFT_WIDTH  172
#define TFT_HEIGHT 320

// ESP32-C6 LCD 1.47 Pin Configuration
#define TFT_MOSI 6   // SDA
#define TFT_SCLK 7   // SCL
#define TFT_CS   14  // Chip select
#define TFT_DC   15  // Data/Command
#define TFT_RST  21  // Reset
#define TFT_BL   22  // Backlight (controlled by PWM in sketch)

// Fonts
#define LOAD_GLCD   // Font 1. Original Adafruit 8 pixel font
#define LOAD_FONT2  // Font 2. Small 16 pixel high font
#define LOAD_FONT4  // Font 4. Medium 26 pixel high font
#define LOAD_FONT6  // Font 6. Large 48 pixel font
#define LOAD_FONT7  // Font 7. 7 segment 48 pixel font
#define LOAD_FONT8  // Font 8. Large 75 pixel font
#define LOAD_GFXFF  // FreeFonts

#define SMOOTH_FONT

// SPI Frequency
#define SPI_FREQUENCY  40000000  // 40MHz (ESP32-C6 can handle this)
#define SPI_READ_FREQUENCY  20000000
#define SPI_TOUCH_FREQUENCY  2500000
