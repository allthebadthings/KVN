/*
 * ESP32-S3-Touch-LCD-3.5B MQTT Relay
 * Waveshare ESP32-S3 3.5" Display (320×480)
 *
 * Hardware:
 *   - ESP32-S3 with 3.5" AXS15231B QSPI Display
 *   - 320×480 IPS capacitive touch
 *   - Speaker, camera, IMU
 */

#include <Arduino_GFX_Library.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "TCA9554.h"
#include "../secrets.h"

// ===== Color Definitions =====
#define BLACK 0x0000
#define WHITE 0xFFFF
#define RED 0xF800
#define GREEN 0x07E0
#define BLUE 0x001F
#define CYAN 0x07FF
#define MAGENTA 0xF81F
#define YELLOW 0xFFE0
#define ORANGE 0xFD20
#define NAVY 0x000F
#define DARKGREY 0x7BEF
#define LIGHTGREY 0xC618

// ===== Display Configuration =====
#define LCD_QSPI_CS 12
#define LCD_QSPI_CLK 5
#define LCD_QSPI_D0 1
#define LCD_QSPI_D1 2
#define LCD_QSPI_D2 3
#define LCD_QSPI_D3 4
#define GFX_BL 6  // Backlight

// Preferred I2C expander pins (fallback list tries both Waveshare default and earlier wiring)
struct I2CBusPins {
  int sda;
  int scl;
};
const I2CBusPins TCA_I2C_CANDIDATES[] = {
  {8, 7},    // Waveshare demo default
  {21, 22}   // Previous wiring attempt
};
const uint8_t TCA_DISPLAY_RESET_PIN = 1;

// TCA9554 I/O expander (controls display reset)
TCA9554 TCA(0x20);

// Back to AXS15231B with QSPI - this one showed colors correctly
Arduino_DataBus* bus = new Arduino_ESP32QSPI(LCD_QSPI_CS, LCD_QSPI_CLK, LCD_QSPI_D0, LCD_QSPI_D1, LCD_QSPI_D2, LCD_QSPI_D3);
Arduino_GFX* gfx = new Arduino_AXS15231B(bus, -1, 1 /* rotation */, false /* IPS */, 480, 320);

// ===== Device Configuration =====
#define DEVICE_ID "esp32_s3_relay"
#define DEVICE_NAME "S3 MQTT Relay"

// ===== Network =====
WiFiClient espClient;
PubSubClient mqtt(espClient);

// ===== State =====
unsigned long lastDisplayUpdate = 0;
unsigned long lastMQTTCheck = 0;

int messageCount = 0;
String lastTopic = "";
String lastMessage = "";
unsigned long lastMessageTime = 0;
bool tcaReady = false;

bool initDisplayReset();
bool pulseDisplayReset();
int activeTcaSda = -1;
int activeTcaScl = -1;

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=== ESP32-S3 3.5\" MQTT Relay ===\n");

  // Initialize I2C for TCA9554 and pulse the hardware reset line if available
  tcaReady = initDisplayReset();
  if (!tcaReady) {
    Serial.println("WARNING: TCA9554 not detected on SDA 8 / SCL 7. Display will rely on software reset only.");
  } else if (!pulseDisplayReset()) {
    Serial.println("WARNING: Failed to toggle display reset via TCA9554.");
  }

  // Initialize display
  Serial.println("Initializing display...");
  if (!gfx->begin()) {
    Serial.println("Display init FAILED!");
  } else {
    Serial.println("Display init OK");
  }

  // Quick sanity text so we immediately know the QSPI path is alive
  gfx->fillScreen(BLACK);
  gfx->setTextColor(WHITE);
  gfx->setTextSize(4);
  gfx->setCursor(40, 120);
  gfx->println("QSPI OK?");
  delay(3000);

  // Enable backlight
  pinMode(GFX_BL, OUTPUT);
  digitalWrite(GFX_BL, HIGH);
  Serial.println("Backlight enabled");

  // Test text rendering with explicit color values
  gfx->fillScreen(0x0000);  // BLACK
  gfx->setTextColor(0xF800);  // RED
  gfx->setTextSize(3);
  gfx->setCursor(10, 10);
  Serial.println("Drawing text: TEXT TEST");
  gfx->println("TEXT TEST");

  gfx->setTextColor(0x07E0);  // GREEN
  gfx->setTextSize(2);
  gfx->setCursor(10, 50);
  Serial.println("Drawing text: Can you see this?");
  gfx->println("Can you see this?");

  gfx->setCursor(10, 90);
  gfx->setTextColor(0xFFFF);  // WHITE
  Serial.println("Drawing text: White text");
  gfx->println("White text");

  delay(5000);

  // Boot screen - landscape 480x320
  Serial.println("Drawing RED screen...");
  gfx->fillScreen(RED);
  delay(1000);

  Serial.println("Drawing GREEN screen...");
  gfx->fillScreen(GREEN);
  delay(1000);

  Serial.println("Drawing BLUE screen...");
  gfx->fillScreen(BLUE);
  delay(1000);

  Serial.println("Drawing BLACK screen...");
  gfx->fillScreen(BLACK);
  delay(500);

  gfx->setTextColor(WHITE);
  gfx->setTextSize(3);
  gfx->setCursor(20, 50);
  gfx->println("KVN SYSTEM");

  gfx->setTextSize(2);
  gfx->setTextColor(CYAN);
  gfx->setCursor(30, 120);
  gfx->println("MQTT Relay");

  gfx->setTextSize(2);
  gfx->setTextColor(YELLOW);
  gfx->setCursor(30, 180);
  gfx->print("320x480");
  gfx->setCursor(30, 210);
  gfx->print(messageCount);
  gfx->println(" msgs");

  // WiFi
  gfx->setTextSize(2);
  gfx->setTextColor(WHITE);
  gfx->setCursor(20, 300);
  gfx->print("WiFi: ");

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

    gfx->setTextColor(GREEN);
    gfx->print("OK");
    gfx->setCursor(20, 340);
    gfx->setTextSize(1);
    gfx->print("IP: ");
    gfx->println(WiFi.localIP());
  } else {
    Serial.println(" Failed!");
    gfx->setTextColor(RED);
    gfx->println("FAILED");
  }

  // MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  delay(3000);

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
    } else {
      Serial.println(" Failed!");
    }
    lastMQTTCheck = now;
  }

  // Display update
  if (now - lastDisplayUpdate > 1000) {
    Serial.println("Updating display...");
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

  Serial.print("MQTT: ");
  Serial.print(topic);
  Serial.print(" = ");
  Serial.println(lastMessage);
}

// ===== Draw Status Screen =====
void drawStatus() {
  gfx->fillScreen(BLACK);

  // Header bar (portrait 320x480)
  gfx->fillRect(0, 0, 320, 50, NAVY);
  gfx->setTextColor(WHITE);
  gfx->setTextSize(2);
  gfx->setCursor(10, 15);
  gfx->println("KVN MQTT RELAY");

  // WiFi & MQTT Status
  gfx->setTextSize(2);
  gfx->setCursor(10, 70);
  gfx->setTextColor(CYAN);
  gfx->print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    gfx->setTextColor(GREEN);
    gfx->println("CONNECTED");
  } else {
    gfx->setTextColor(RED);
    gfx->println("DISCONNECTED");
  }

  gfx->setCursor(10, 100);
  gfx->setTextColor(CYAN);
  gfx->print("MQTT: ");
  if (mqtt.connected()) {
    gfx->setTextColor(GREEN);
    gfx->println("CONNECTED");
  } else {
    gfx->setTextColor(RED);
    gfx->println("DISCONNECTED");
  }

  // IP Address
  gfx->setTextSize(2);
  gfx->setTextColor(YELLOW);
  gfx->setCursor(10, 140);
  gfx->print("IP: ");
  gfx->setTextColor(WHITE);
  gfx->println(WiFi.localIP());

  // Message count
  gfx->setTextSize(2);
  gfx->setTextColor(YELLOW);
  gfx->setCursor(10, 180);
  gfx->print("Messages: ");
  gfx->setTextColor(WHITE);
  gfx->println(messageCount);

  // Last message section
  gfx->setTextSize(1);
  gfx->setTextColor(MAGENTA);
  gfx->setCursor(10, 220);
  gfx->println("Last Topic:");

  gfx->setTextColor(WHITE);
  gfx->setCursor(10, 240);
  if (lastTopic.length() > 0) {
    String topic = lastTopic;
    if (topic.length() > 50) topic = topic.substring(0, 47) + "...";
    gfx->println(topic);
  } else {
    gfx->setTextColor(DARKGREY);
    gfx->println("Waiting for messages...");
  }

  gfx->setTextColor(MAGENTA);
  gfx->setCursor(10, 270);
  gfx->println("Last Message:");

  gfx->setTextColor(WHITE);
  gfx->setCursor(10, 290);
  if (lastMessage.length() > 0) {
    String msg = lastMessage;
    if (msg.length() > 50) msg = msg.substring(0, 47) + "...";
    gfx->println(msg);
  } else {
    gfx->setTextColor(DARKGREY);
    gfx->println("Waiting for messages...");
  }
}

bool initDisplayReset() {
  for (const auto& pins : TCA_I2C_CANDIDATES) {
    Serial.printf("Trying TCA9554 on SDA %d / SCL %d...\n", pins.sda, pins.scl);
    Wire.begin(pins.sda, pins.scl);

    if (!TCA.begin()) {
      Serial.println("  No response from TCA9554 on this bus.");
      continue;
    }

    if (!TCA.pinMode1(TCA_DISPLAY_RESET_PIN, OUTPUT)) {
      Serial.println("  Failed to configure reset pin via TCA9554.");
      continue;
    }

    activeTcaSda = pins.sda;
    activeTcaScl = pins.scl;
    Serial.println("  TCA9554 ready.");
    return true;
  }

  Serial.println("TCA9554 not detected on known SDA/SCL pairs.");
  return false;
}

bool pulseDisplayReset() {
  if (!TCA.write1(TCA_DISPLAY_RESET_PIN, 1)) return false;
  delay(10);
  if (!TCA.write1(TCA_DISPLAY_RESET_PIN, 0)) return false;
  delay(10);
  if (!TCA.write1(TCA_DISPLAY_RESET_PIN, 1)) return false;
  delay(200);
  return true;
}
