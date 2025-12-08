// s3_config.h - ESP32-S3 Pin Definitions
#ifndef S3_CONFIG_H
#define S3_CONFIG_H

// SPI Display (ILI9341/ILI9488)
#define TFT_CS 4
#define TFT_DC 5
#define TFT_RST 6
#define TFT_MOSI 7
#define TFT_CLK 8

// UART Radar (HIGH GPIOs to avoid I2S conflict!)
#define RADAR_RX 44
#define RADAR_TX 43

// I2C (Optional)
#define I2C_SDA 9
#define I2C_SCL 10

#endif