// hub_config.h - ESP32-P4 Pin Definitions
#ifndef HUB_CONFIG_H
#define HUB_CONFIG_H

// UART Connections (Radars)
#define UART1_RX 16  // LD2420 Bed Radar
#define UART1_TX 17
#define UART2_RX 18  // LD2420 Door Radar
#define UART2_TX 19
#define UART3_RX 26  // RD03-EG521 Zone Radar
#define UART4_TX 33  // RD03-DG521 Intent Radar

// I2C Bus (Sensors)
#define I2C_SDA 21
#define I2C_SCL 22
#define BH1750_ADDR 0x23
#define GRAVITY_AI_1 0x62
#define GRAVITY_AI_2 0x63

// I2S Microphone (INMP441)
#define I2S_WS 25
#define I2S_SCK 32
#define I2S_SD 34

#endif
