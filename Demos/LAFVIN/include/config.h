#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi Settings ---
// REPLACE WITH YOUR WIFI CREDENTIALS
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// --- Server Settings ---
// IP Address of the computer running the Python server
#define SERVER_IP "192.168.1.100" 
#define SERVER_PORT 5000

// --- Hardware Pins (ESP32-S3) ---
// IMPORTANT: Verify these pins match your specific LAFVIN Kit!

// I2S Microphone (e.g., INMP441)
#define I2S_MIC_SCK 42
#define I2S_MIC_WS  41
#define I2S_MIC_SD  2

// I2S Speaker/Amplifier (e.g., MAX98357A)
#define I2S_SPK_BCLK 15
#define I2S_SPK_LRC  16
#define I2S_SPK_DIN  7

// Display (OLED/TFT) - Example for I2C SSD1306
#define I2C_SDA 8
#define I2C_SCL 9

// Button (Push-to-talk)
#define BUTTON_PIN 0  // Boot button often used for testing

// --- Audio Settings ---
#define SAMPLE_RATE 16000
#define BUFFER_SIZE 1024

#endif
