#include <WiFi.h>
#include <PubSubClient.h>
#include "s3_config.h"

// WiFi and MQTT Config (Replace with secrets or shared config)
const char* WIFI_SSID = "guy-fi";
const char* WIFI_PASSWORD = "";
const char* MQTT_HOST = "192.168.1.100"; // Hub IP
const uint16_t MQTT_PORT = 1883;

WiFiClient espClient;
PubSubClient mqtt(espClient);

// Placeholder for Display Library (e.g., TFT_eSPI)
// #include <TFT_eSPI.h>
// TFT_eSPI tft = TFT_eSPI(); 

String chipId() {
  uint64_t id = ESP.getEfuseMac();
  char buf[17];
  snprintf(buf, sizeof(buf), "%04X%08X", (uint32_t)(id>>32), (uint32_t)id);
  return String(buf);
}

String topicBase() {
  return String("vanguard/node/") + chipId();
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
}

void connectMQTT() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  while (!mqtt.connected()) {
    String cid = String("s3-") + chipId();
    if (mqtt.connect(cid.c_str())) {
      mqtt.subscribe((topicBase() + "/#").c_str());
    } else {
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize Display (Placeholder)
  // tft.init();
  // tft.setRotation(1);
  
  // Initialize UART Radar
  Serial1.begin(115200, SERIAL_8N1, RADAR_RX, RADAR_TX);
  
  // Initialize I2C
  // Wire.begin(I2C_SDA, I2C_SCL);

  connectWiFi();
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  // Radar Reading Logic (Placeholder)
  if (Serial1.available()) {
    // Process radar data
  }
  
  delay(10);
}
