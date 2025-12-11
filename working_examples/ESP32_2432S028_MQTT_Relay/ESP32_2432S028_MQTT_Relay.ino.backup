/*
 * ESP32-2432S028R (Cheap Yellow Display) MQTT Relay
 *
 * Dedicated MQTT relay for KVN Coordinator System with:
 * - 2.8" ILI9341 TFT display (240x320)
 * - Built-in LDR auto-brightness
 * - RGB LED status indicator
 * - Touch screen support
 * - MQTT message relay and monitoring
 *
 * Hardware:
 *   - ESP32-2432S028R board (Cheap Yellow Display)
 *   - Built-in LDR on GPIO 34
 *   - Built-in RGB LED (R:4, G:16, B:17)
 *   - WiFi connection to broker
 *
 * Display: 240x320 ILI9341 over HSPI
 * LDR: GPIO 34 (ADC1_CH6, input-only)
 * RGB LED: GPIO 4 (R), 16 (G), 17 (B) - Active LOW
 */

#include <LovyanGFX.hpp>
#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>
#include "../secrets.h"

// ===== Display Configuration =====
class LGFX : public lgfx::LGFX_Device
{
  lgfx::Panel_ILI9341 _panel_instance;
  lgfx::Bus_SPI _bus_instance;
  lgfx::Light_PWM _light_instance;

public:
  LGFX(void)
  {
    {
      auto cfg = _bus_instance.config();
      cfg.spi_host = HSPI_HOST;  // Use HSPI
      cfg.spi_mode = 0;
      cfg.freq_write = 40000000; // 40MHz
      cfg.freq_read = 16000000;
      cfg.spi_3wire = false;
      cfg.use_lock = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;
      cfg.pin_sclk = 14;  // SCK
      cfg.pin_mosi = 13;  // MOSI
      cfg.pin_miso = 12;  // MISO
      cfg.pin_dc = 2;     // DC/RS
      _bus_instance.config(cfg);
      _panel_instance.setBus(&_bus_instance);
    }

    {
      auto cfg = _panel_instance.config();
      cfg.pin_cs = 15;   // CS
      cfg.pin_rst = -1;  // No RST pin
      cfg.pin_busy = -1;
      cfg.memory_width = 240;
      cfg.memory_height = 320;
      cfg.panel_width = 240;
      cfg.panel_height = 320;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      cfg.offset_rotation = 0;
      cfg.dummy_read_pixel = 8;
      cfg.dummy_read_bits = 1;
      cfg.readable = true;
      cfg.invert = false;  // Disable inversion
      cfg.rgb_order = false;
      cfg.dlen_16bit = false;
      cfg.bus_shared = true;
      _panel_instance.config(cfg);
    }

    {
      auto cfg = _light_instance.config();
      cfg.pin_bl = 21;        // Backlight
      cfg.invert = false;
      cfg.freq = 44100;
      cfg.pwm_channel = 7;
      _light_instance.config(cfg);
      _panel_instance.setLight(&_light_instance);
    }

    setPanel(&_panel_instance);
  }
};

LGFX tft;

// ===== Pin Definitions =====
#define LDR_PIN 34        // Built-in LDR (input-only)
#define RGB_LED_R 4       // Red LED (active LOW)
#define RGB_LED_G 16      // Green LED (active LOW)
#define RGB_LED_B 17      // Blue LED (active LOW)

// ===== Device Configuration =====
#define DEVICE_ID "esp32_cyd_relay"
#define DEVICE_NAME "CYD MQTT Relay"

// ===== Display Settings =====
#define SCREEN_WIDTH 240
#define SCREEN_HEIGHT 320
#define LDR_MIN_BRIGHTNESS 30
#define LDR_MAX_BRIGHTNESS 255

// ===== Network Configuration =====
WiFiClient espClient;
PubSubClient mqtt(espClient);

// ===== LDR Sensor =====
KVN_LDR ldr(LDR_PIN);

// ===== State Variables =====
unsigned long lastDisplayUpdate = 0;
unsigned long lastLDRUpdate = 0;
unsigned long lastMQTTCheck = 0;
const unsigned long DISPLAY_UPDATE_INTERVAL = 1000;   // 1 second
const unsigned long LDR_UPDATE_INTERVAL = 500;        // 0.5 seconds
const unsigned long MQTT_CHECK_INTERVAL = 100;        // 0.1 seconds

int messageCount = 0;
String lastTopic = "";
String lastMessage = "";
unsigned long lastMessageTime = 0;

// Display screens
enum Screen { SCREEN_STATUS, SCREEN_MESSAGES, SCREEN_NETWORK };
Screen currentScreen = SCREEN_STATUS;

// ===== RGB LED Functions =====
void setRGBColor(bool red, bool green, bool blue) {
  digitalWrite(RGB_LED_R, !red);    // Active LOW
  digitalWrite(RGB_LED_G, !green);
  digitalWrite(RGB_LED_B, !blue);
}

void rgbOff() { setRGBColor(false, false, false); }
void rgbRed() { setRGBColor(true, false, false); }
void rgbGreen() { setRGBColor(false, true, false); }
void rgbBlue() { setRGBColor(false, false, true); }
void rgbYellow() { setRGBColor(true, true, false); }
void rgbCyan() { setRGBColor(false, true, true); }
void rgbMagenta() { setRGBColor(true, false, true); }
void rgbWhite() { setRGBColor(true, true, true); }

// ===== Setup =====
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=== ESP32-2432S028R MQTT Relay ===");
  Serial.println("Cheap Yellow Display (CYD)\n");

  // Initialize RGB LED
  pinMode(RGB_LED_R, OUTPUT);
  pinMode(RGB_LED_G, OUTPUT);
  pinMode(RGB_LED_B, OUTPUT);
  rgbBlue(); // Blue = booting

  // SKIP DISPLAY INIT FOR TESTING
  Serial.println("Display initialization skipped for testing");

  // Initialize LDR
  ldr.begin();
  Serial.println("LDR initialized on GPIO " + String(LDR_PIN));

  // Connect to WiFi
  Serial.println("Connecting WiFi...");
  connectWiFi();

  // Setup MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(mqttCallback);

  rgbGreen(); // Green = ready

  Serial.println("\nRelay ready!");
  Serial.println("Running WITHOUT display to test stability...");
}

// ===== Main Loop =====
void loop() {
  unsigned long now = millis();

  // Feed watchdog
  yield();

  // Maintain MQTT connection (quick check only)
  if (mqtt.connected()) {
    mqtt.loop();
  } else if (now - lastMQTTCheck > 5000) {  // Only try reconnect every 5 seconds
    Serial.println("MQTT disconnected, attempting reconnect...");
    if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println("MQTT reconnected!");
      mqtt.subscribe("homeassistant/sensor/+/+");
      mqtt.subscribe("vanguard/control/+/+");
      mqtt.subscribe("vanguard/ai/+");
    }
    lastMQTTCheck = now;
  }

  // Update LDR and backlight
  if (now - lastLDRUpdate > LDR_UPDATE_INTERVAL) {
    // DISPLAY DISABLED FOR TESTING
    // tft.setBrightness(200);

    // Print LDR values to serial instead
    Serial.print("LDR: ");
    Serial.print(ldr.getLux());
    Serial.print(" lux, Raw: ");
    Serial.print(analogRead(LDR_PIN));
    Serial.print(", Messages: ");
    Serial.println(messageCount);

    lastLDRUpdate = now;
  }

  // DISPLAY UPDATE DISABLED FOR TESTING
  // if (now - lastDisplayUpdate > 2000) {
  //   drawStatusScreen();
  //   lastDisplayUpdate = now;
  // }

  delay(50);  // Longer delay to reduce CPU load
}

// ===== WiFi Connection =====
void connectWiFi() {
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
    rgbGreen();
  } else {
    Serial.println(" Failed!");
    rgbRed();
  }
}

// ===== MQTT Connection =====
void reconnectMQTT() {
  if (mqtt.connected()) return;

  rgbYellow(); // Yellow = connecting

  Serial.print("Connecting to MQTT...");

  if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
    Serial.println(" connected!");

    // Subscribe to all KVN topics
    mqtt.subscribe("homeassistant/sensor/+/+");
    mqtt.subscribe("vanguard/control/+/+");
    mqtt.subscribe("vanguard/ai/+");

    // Publish online status
    mqtt.publish("vanguard/relay/status", "online", true);

    rgbGreen(); // Green = connected

  } else {
    Serial.print(" failed, rc=");
    Serial.println(mqtt.state());
    rgbRed(); // Red = error
  }
}

// ===== MQTT Callback =====
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  messageCount++;

  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  lastTopic = String(topic);
  lastMessage = message;
  lastMessageTime = millis();

  // Flash LED on message
  rgbCyan();
  delay(50);
  rgbGreen();

  Serial.print("MQTT [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
}

// ===== Backlight Control =====
void updateBacklight() {
  // Read LDR value
  int ldrValue = analogRead(LDR_PIN);

  // Map to brightness (30-255 range)
  int brightness = map(ldrValue, 500, 3500, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);
  brightness = constrain(brightness, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);

  // Apply gamma correction for smooth brightness
  float normalized = brightness / 255.0;
  int adjusted = (int)(pow(normalized, 2.2) * 255);

  // Set backlight
  tft.setBrightness(adjusted);
}

// ===== Display Screens =====
void drawStatusScreen() {
  Serial.println("Drawing status screen...");
  tft.fillScreen(TFT_BLACK);
  Serial.println("Screen filled");

  // Simple test - just draw some basic shapes
  tft.fillRect(10, 10, 100, 50, TFT_RED);
  Serial.println("Red rect drawn");

  tft.fillRect(120, 10, 100, 50, TFT_GREEN);
  Serial.println("Green rect drawn");

  tft.fillRect(230, 10, 80, 50, TFT_BLUE);
  Serial.println("Blue rect drawn");

  tft.setTextSize(2);
  tft.setTextColor(TFT_WHITE);
  tft.setCursor(10, 80);
  tft.print("MQTT RELAY");
  Serial.println("Text drawn");

  // Show message count
  tft.setTextSize(3);
  tft.setCursor(10, 110);
  tft.print("Messages: ");
  tft.println(messageCount);
  Serial.println("Message count drawn");

  Serial.println("Status screen complete!");
}

void drawMessagesScreen() {
  // Future: Show message log
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(10, 10);
  tft.setTextSize(2);
  tft.println("Messages");
  tft.setTextSize(1);
  tft.setCursor(10, 40);
  tft.println("Not implemented yet");
}

void drawNetworkScreen() {
  // Future: Show network stats
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(10, 10);
  tft.setTextSize(2);
  tft.println("Network");
  tft.setTextSize(1);
  tft.setCursor(10, 40);
  tft.println("Not implemented yet");
}
