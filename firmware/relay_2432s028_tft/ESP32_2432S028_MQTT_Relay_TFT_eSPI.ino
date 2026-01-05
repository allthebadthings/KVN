/*
 * ESP32-2432S028R (Cheap Yellow Display) MQTT Relay
 * Using TFT_eSPI (stable version)
 *
 * Hardware:
 *   - ESP32-2432S028R board (Cheap Yellow Display)
 *   - Built-in LDR on GPIO 34
 *   - Built-in RGB LED (R:4, G:16, B:17)
 */

#include <TFT_eSPI.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>
#include "../secrets.h"

// ===== Display =====
TFT_eSPI tft = TFT_eSPI();

// ===== Pin Definitions =====
#define LDR_PIN 34
#define RGB_LED_R 4
#define RGB_LED_G 16
#define RGB_LED_B 17
#define TFT_BL 21

// ===== Device Configuration =====
#define DEVICE_ID "esp32_cyd_relay"
#define DEVICE_NAME "CYD MQTT Relay"

// ===== Network =====
WiFiClient espClient;
PubSubClient mqtt(espClient);

// ===== Sensors =====
KVN_LDR ldr(LDR_PIN);

// ===== State =====
unsigned long lastDisplayUpdate = 0;
unsigned long lastLDRUpdate = 0;
unsigned long lastMQTTCheck = 0;

int messageCount = 0;
String lastTopic = "";
String lastMessage = "";
unsigned long lastMessageTime = 0;

// ===== RGB LED =====
void setRGB(bool r, bool g, bool b) {
  digitalWrite(RGB_LED_R, !r);
  digitalWrite(RGB_LED_G, !g);
  digitalWrite(RGB_LED_B, !b);
}

void rgbRed() {
  setRGB(1, 0, 0);
}
void rgbGreen() {
  setRGB(0, 1, 0);
}
void rgbBlue() {
  setRGB(0, 0, 1);
}
void rgbYellow() {
  setRGB(1, 1, 0);
}
void rgbCyan() {
  setRGB(0, 1, 1);
}

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=== CYD MQTT Relay (TFT_eSPI) ===\n");

  // RGB LED
  pinMode(RGB_LED_R, OUTPUT);
  pinMode(RGB_LED_G, OUTPUT);
  pinMode(RGB_LED_B, OUTPUT);
  rgbBlue();

  // Backlight
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);

  // Display
  tft.init();
  tft.setRotation(3);  // Landscape
  tft.fillScreen(TFT_BLACK);

  // Boot screen
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(3);
  tft.setCursor(20, 30);
  tft.println("KVN SYSTEM");

  tft.setTextSize(2);
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.setCursor(20, 70);
  tft.println("MQTT Relay");

  tft.setTextSize(1);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setCursor(20, 100);
  tft.println("TFT_eSPI - Cheap Yellow Display");

  // LDR
  ldr.begin();
  Serial.println("LDR initialized");

  // WiFi
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(20, 130);
  tft.print("WiFi...");

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.setCursor(20, 150);
    tft.print("Connected! ");
    tft.println(WiFi.localIP());
    rgbGreen();
  } else {
    Serial.println(" Failed!");
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.setCursor(20, 150);
    tft.println("FAILED!");
    rgbRed();
  }

  // MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  delay(2000);

  Serial.println("Ready!");
}

// ===== Main Loop =====
void loop() {
  unsigned long now = millis();

  // MQTT
  if (mqtt.connected()) {
    mqtt.loop();
  } else if (now - lastMQTTCheck > 5000) {
    Serial.print("MQTT connecting...");
    if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println(" OK!");
      mqtt.subscribe("homeassistant/sensor/+/+");
      mqtt.subscribe("vanguard/+/+");
      rgbGreen();
    } else {
      Serial.println(" Failed!");
      rgbYellow();
    }
    lastMQTTCheck = now;
  }

  // LDR
  if (now - lastLDRUpdate > 500) {
    uint16_t lux = ldr.getLux();
    uint16_t raw = analogRead(LDR_PIN);

    // Auto-brightness (30-255 range with gamma)
    int brightness = map(raw, 500, 3500, 30, 255);
    brightness = constrain(brightness, 30, 255);
    float normalized = brightness / 255.0;
    int adjusted = (int)(pow(normalized, 2.2) * 255);
    analogWrite(TFT_BL, adjusted);

    lastLDRUpdate = now;
  }

  // Display
  if (now - lastDisplayUpdate > 1000) {
    drawStatus();
    lastDisplayUpdate = now;
  }

  delay(10);
}

// ===== MQTT Callback =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  messageCount++;

  lastTopic = String(topic);
  lastMessage = "";
  for (unsigned int i = 0; i < length; i++) {
    lastMessage += (char)payload[i];
  }
  lastMessageTime = millis();

  // Flash cyan
  rgbCyan();
  delay(50);
  rgbGreen();

  Serial.print("MQTT: ");
  Serial.print(topic);
  Serial.print(" = ");
  Serial.println(lastMessage);
}

// ===== Draw Status Screen =====
void drawStatus() {
  tft.fillScreen(TFT_BLACK);

  // Header
  tft.fillRect(0, 0, 320, 25, TFT_NAVY);
  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE, TFT_NAVY);
  tft.setCursor(5, 5);
  tft.print("MQTT RELAY");

  // Uptime
  tft.setTextSize(1);
  tft.setCursor(240, 9);
  unsigned long secs = millis() / 1000;
  tft.printf("%02d:%02d", (secs / 60) % 60, secs % 60);

  // Status
  tft.setTextSize(2);
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.setCursor(10, 35);
  tft.print("STATUS: ");

  if (WiFi.status() == WL_CONNECTED && mqtt.connected()) {
    tft.setTextColor(TFT_GREEN, TFT_BLACK);
    tft.println("ONLINE");
  } else if (WiFi.status() == WL_CONNECTED) {
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    tft.println("WIFI OK");
  } else {
    tft.setTextColor(TFT_RED, TFT_BLACK);
    tft.println("OFFLINE");
  }

  // Messages
  tft.setTextSize(1);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 65);
  tft.println("MQTT Messages:");

  tft.setTextSize(4);
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.setCursor(10, 80);
  tft.println(messageCount);

  // Network
  tft.setTextSize(1);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 120);
  tft.print("IP: ");
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.println(WiFi.localIP());

  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 135);
  tft.print("RSSI: ");
  tft.setTextColor(TFT_GREEN, TFT_BLACK);
  tft.print(WiFi.RSSI());
  tft.println(" dBm");

  // Light
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setCursor(10, 150);
  tft.print("Light: ");
  tft.setTextColor(TFT_YELLOW, TFT_BLACK);
  tft.print(ldr.getLux());
  tft.println(" lux");

  // Last message
  tft.fillRect(0, 170, 320, 70, TFT_DARKGREY);
  tft.setTextColor(TFT_CYAN, TFT_DARKGREY);
  tft.setCursor(5, 175);
  tft.println("LAST MQTT:");

  if (lastTopic.length() > 0) {
    tft.setTextColor(TFT_WHITE, TFT_DARKGREY);
    tft.setCursor(5, 190);
    String topic = lastTopic;
    if (topic.length() > 50) topic = topic.substring(0, 47) + "...";
    tft.println(topic);

    tft.setTextColor(TFT_YELLOW, TFT_DARKGREY);
    tft.setCursor(5, 205);
    String msg = lastMessage;
    if (msg.length() > 50) msg = msg.substring(0, 47) + "...";
    tft.println(msg);

    tft.setTextColor(TFT_LIGHTGREY, TFT_DARKGREY);
    tft.setCursor(5, 220);
    unsigned long ago = (millis() - lastMessageTime) / 1000;
    if (ago < 60) {
      tft.printf("%ds ago", ago);
    } else {
      tft.printf("%dm ago", ago / 60);
    }
  } else {
    tft.setTextColor(TFT_LIGHTGREY, TFT_DARKGREY);
    tft.setCursor(5, 200);
    tft.println("Waiting...");
  }
}
