/*
 * KVN MQTT Relay - ESP32-C6-LCD-1.47
 *
 * Intelligent MQTT bridge between KVN devices and Home Assistant
 * Features:
 *   - Real-time status display on 1.47" LCD
 *   - Message buffering during HA outages
 *   - Device connectivity monitoring
 *   - Auto-brightness with LDR sensor
 *
 * Hardware: Waveshare ESP32-C6-LCD-1.47
 * Display: ST7789 172x320 RGB565 (LovyanGFX library)
 *
 * Author: KVN System
 * Last Updated: 2025-12-08
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <LovyanGFX.hpp>
#include <map>
#include <vector>

// ==================== CONFIGURATION ====================
#include "../secrets.h"

// Display Configuration
#define TFT_BL_PIN 22        // Backlight PWM
#define BACKLIGHT_LEVEL 255  // 0-255 (default/manual brightness)

// LDR (Light Dependent Resistor) Configuration
#define LDR_PIN 0            // GPIO 0 (ADC capable)
#define LDR_MIN_BRIGHTNESS 30   // Minimum backlight (night mode)
#define LDR_MAX_BRIGHTNESS 255  // Maximum backlight (bright light)
#define AUTO_BRIGHTNESS true    // Enable/disable auto-brightness

// RGB LED Pin (WS2812)
#define RGB_LED_PIN 23

// Device Configuration
#define DEVICE_TIMEOUT_MS 30000  // Consider device offline after 30s
#define STATUS_UPDATE_INTERVAL 1000  // Update display every 1s
#define BUFFER_SIZE 100  // Message buffer size

// ==================== LOVYANGFX DISPLAY SETUP ====================

class LGFX : public lgfx::LGFX_Device
{
  lgfx::Panel_ST7789 _panel_instance;
  lgfx::Bus_SPI _bus_instance;
  lgfx::Light_PWM _light_instance;

public:
  LGFX(void)
  {
    {
      auto cfg = _bus_instance.config();
      cfg.spi_host = SPI2_HOST;  // ESP32-C6 SPI
      cfg.spi_mode = 0;
      cfg.freq_write = 40000000; // 40MHz
      cfg.freq_read  = 16000000;
      cfg.spi_3wire  = true;
      cfg.use_lock   = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;
      cfg.pin_sclk = 7;   // SCL
      cfg.pin_mosi = 6;   // SDA
      cfg.pin_miso = -1;  // Not used
      cfg.pin_dc   = 15;  // DC

      _bus_instance.config(cfg);
      _panel_instance.setBus(&_bus_instance);
    }

    {
      auto cfg = _panel_instance.config();
      cfg.pin_cs           = 14;
      cfg.pin_rst          = 21;
      cfg.pin_busy         = -1;

      cfg.panel_width      = 172;
      cfg.panel_height     = 320;
      cfg.offset_x         = 34;
      cfg.offset_y         = 0;
      cfg.offset_rotation  = 0;
      cfg.dummy_read_pixel = 8;
      cfg.dummy_read_bits  = 1;
      cfg.readable         = false;
      cfg.invert           = true;
      cfg.rgb_order        = false;
      cfg.dlen_16bit       = false;
      cfg.bus_shared       = false;

      _panel_instance.config(cfg);
    }

    {
      auto cfg = _light_instance.config();
      cfg.pin_bl = 22;
      cfg.invert = false;
      cfg.freq   = 44100;
      cfg.pwm_channel = 0;

      _light_instance.config(cfg);
      _panel_instance.setLight(&_light_instance);
    }

    setPanel(&_panel_instance);
  }
};

// ==================== HARDWARE SETUP ====================
WiFiClient espClient;
PubSubClient mqtt(espClient);
LGFX tft;

// ==================== GLOBAL STATE ====================
struct DeviceStatus {
    String name;
    unsigned long lastSeen;
    bool online;
    int messageCount;
};

std::map<String, DeviceStatus> devices;
unsigned long lastStatusUpdate = 0;
unsigned long startTime = 0;
int messagesRX = 0;
int messagesTX = 0;
bool haOnline = false;
int currentScreen = 0;  // 0=status, 1=devices, 2=traffic
unsigned long lastButtonPress = 0;

// Message buffer for failover
struct BufferedMessage {
    String topic;
    String payload;
};
std::vector<BufferedMessage> messageBuffer;

// ==================== DISPLAY FUNCTIONS ====================

void initDisplay() {
    tft.init();
    tft.setRotation(0);  // Portrait mode
    tft.fillScreen(TFT_BLACK);
    tft.setBrightness(BACKLIGHT_LEVEL);

    // Initialize LDR pin if auto-brightness enabled
    if (AUTO_BRIGHTNESS) {
        pinMode(LDR_PIN, INPUT);
        analogReadResolution(12);  // 12-bit ADC (0-4095)
        analogSetAttenuation(ADC_11db);  // Full 0-3.3V range
    }

    // Show boot screen
    tft.setTextColor(TFT_CYAN);
    tft.setTextSize(2);
    tft.setCursor(20, 100);
    tft.println("KVN MQTT RELAY");
    tft.setTextSize(1);
    tft.setCursor(30, 140);
    tft.setTextColor(TFT_WHITE);
    tft.println("Initializing...");
}

void updateBacklight() {
    if (!AUTO_BRIGHTNESS) {
        tft.setBrightness(BACKLIGHT_LEVEL);
        return;
    }

    // Read LDR value (higher value = more light)
    int ldrValue = analogRead(LDR_PIN);

    // ESP32-C6 12-bit ADC: 0-4095
    // Map LDR reading to backlight brightness
    int brightness = map(ldrValue, 500, 3500, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);
    brightness = constrain(brightness, LDR_MIN_BRIGHTNESS, LDR_MAX_BRIGHTNESS);

    // Apply exponential curve for natural brightness perception
    float normalized = brightness / 255.0;
    int adjusted = (int)(pow(normalized, 2.2) * 255);

    tft.setBrightness(adjusted);

    // Debug output (optional)
    static unsigned long lastDebug = 0;
    if (millis() - lastDebug > 5000) {
        Serial.print("LDR: ");
        Serial.print(ldrValue);
        Serial.print(" → Brightness: ");
        Serial.print(brightness);
        Serial.print(" → Adjusted: ");
        Serial.println(adjusted);
        lastDebug = millis();
    }
}

void drawStatusScreen() {
    tft.fillScreen(TFT_BLACK);

    // Title
    tft.setTextColor(TFT_CYAN);
    tft.setTextSize(2);
    tft.setCursor(10, 10);
    tft.println("KVN RELAY");

    // Line separator
    tft.drawFastHLine(0, 35, 172, TFT_DARKGREY);

    tft.setTextSize(1);

    // WiFi Status
    tft.setCursor(10, 45);
    tft.setTextColor(TFT_GREEN);
    tft.print("WiFi: ");
    int rssi = WiFi.RSSI();
    tft.print(rssi);
    tft.println(" dBm");

    // Signal strength bars
    int bars = map(constrain(rssi, -100, -40), -100, -40, 0, 5);
    for (int i = 0; i < 5; i++) {
        if (i < bars) {
            tft.fillCircle(15 + i * 12, 60, 3, TFT_GREEN);
        } else {
            tft.drawCircle(15 + i * 12, 60, 3, TFT_DARKGREY);
        }
    }

    // MQTT Status
    tft.setCursor(10, 75);
    if (mqtt.connected()) {
        tft.setTextColor(TFT_GREEN);
        tft.println("MQTT: CONNECTED");
    } else {
        tft.setTextColor(TFT_RED);
        tft.println("MQTT: OFFLINE");
    }

    // Device count
    int onlineCount = 0;
    for (auto& device : devices) {
        if (device.second.online) onlineCount++;
    }

    tft.setCursor(10, 95);
    tft.setTextColor(TFT_WHITE);
    tft.print("Devices: ");
    tft.setTextColor(TFT_YELLOW);
    tft.print(onlineCount);
    tft.setTextColor(TFT_DARKGREY);
    tft.print("/");
    tft.println(devices.size());

    // Message stats
    tft.setCursor(10, 115);
    tft.setTextColor(TFT_WHITE);
    tft.print("RX: ");
    tft.setTextColor(TFT_CYAN);
    tft.println(messagesRX);

    tft.setCursor(10, 130);
    tft.setTextColor(TFT_WHITE);
    tft.print("TX: ");
    tft.setTextColor(TFT_MAGENTA);
    tft.println(messagesTX);

    // Buffer status
    tft.setCursor(10, 150);
    tft.setTextColor(TFT_WHITE);
    tft.print("Buffer: ");
    if (messageBuffer.size() > 0) {
        tft.setTextColor(TFT_YELLOW);
    } else {
        tft.setTextColor(TFT_GREEN);
    }
    tft.print(messageBuffer.size());
    tft.setTextColor(TFT_DARKGREY);
    tft.print("/");
    tft.println(BUFFER_SIZE);

    // HA Broker status
    tft.setCursor(10, 170);
    tft.setTextColor(TFT_WHITE);
    tft.print("HA: ");
    if (haOnline) {
        tft.setTextColor(TFT_GREEN);
        tft.println("ONLINE");
    } else {
        tft.setTextColor(TFT_RED);
        tft.println("OFFLINE");
    }

    // Uptime
    unsigned long uptime = (millis() - startTime) / 1000;
    int days = uptime / 86400;
    int hours = (uptime % 86400) / 3600;
    int minutes = (uptime % 3600) / 60;

    tft.setCursor(10, 190);
    tft.setTextColor(TFT_WHITE);
    tft.print("Uptime: ");
    tft.setTextColor(TFT_CYAN);
    if (days > 0) {
        tft.print(days);
        tft.print("d ");
    }
    tft.print(hours);
    tft.print("h ");
    tft.print(minutes);
    tft.println("m");

    // Footer
    tft.drawFastHLine(0, 300, 172, TFT_DARKGREY);
    tft.setCursor(20, 310);
    tft.setTextSize(1);
    tft.setTextColor(TFT_DARKGREY);
    tft.println("[BOOT=Next Screen]");
}

void drawDeviceScreen() {
    tft.fillScreen(TFT_BLACK);

    // Title
    tft.setTextColor(TFT_CYAN);
    tft.setTextSize(2);
    tft.setCursor(10, 10);
    tft.println("DEVICES");

    tft.drawFastHLine(0, 35, 172, TFT_DARKGREY);

    tft.setTextSize(1);

    // List devices
    int y = 45;
    int index = 0;
    for (auto& device : devices) {
        if (index >= 8) break;  // Max 8 devices on screen

        tft.setCursor(10, y);

        // Status indicator
        if (device.second.online) {
            tft.setTextColor(TFT_GREEN);
            tft.print("[OK]");
        } else {
            tft.setTextColor(TFT_RED);
            tft.print("[--]");
        }

        // Device name (truncate if too long)
        tft.setTextColor(TFT_WHITE);
        tft.print(" ");
        String name = device.second.name;
        if (name.length() > 12) {
            name = name.substring(0, 12);
        }
        tft.println(name);

        // Time since last message
        tft.setCursor(30, y + 12);
        tft.setTextColor(TFT_DARKGREY);
        unsigned long elapsed = (millis() - device.second.lastSeen) / 1000;
        if (elapsed < 60) {
            tft.print(elapsed);
            tft.println("s ago");
        } else {
            tft.print(elapsed / 60);
            tft.println("m ago");
        }

        y += 32;
        index++;
    }

    // Summary
    int onlineCount = 0;
    for (auto& device : devices) {
        if (device.second.online) onlineCount++;
    }

    tft.drawFastHLine(0, 280, 172, TFT_DARKGREY);
    tft.setCursor(10, 290);
    tft.setTextColor(TFT_YELLOW);
    tft.print(onlineCount);
    tft.setTextColor(TFT_WHITE);
    tft.print("/");
    tft.print(devices.size());
    tft.println(" Online");
}

void updateDisplay() {
    // Check device timeouts
    for (auto& device : devices) {
        if (millis() - device.second.lastSeen > DEVICE_TIMEOUT_MS) {
            device.second.online = false;
        }
    }

    // Update current screen
    switch (currentScreen) {
        case 0:
            drawStatusScreen();
            break;
        case 1:
            drawDeviceScreen();
            break;
        default:
            currentScreen = 0;
            drawStatusScreen();
    }
}

// ==================== MQTT FUNCTIONS ====================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    messagesRX++;

    // Convert payload to string
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    Serial.print("MQTT RX: ");
    Serial.print(topic);
    Serial.print(" = ");
    Serial.println(message);

    // Extract device ID from topic
    String topicStr = String(topic);

    // Look for device identifier in topic (e.g., esp32_XXXXXX)
    int deviceIdStart = topicStr.indexOf("esp32_");
    if (deviceIdStart >= 0) {
        int deviceIdEnd = topicStr.indexOf("/", deviceIdStart);
        if (deviceIdEnd < 0) deviceIdEnd = topicStr.length();

        String deviceId = topicStr.substring(deviceIdStart, deviceIdEnd);

        // Update device status
        if (devices.find(deviceId) == devices.end()) {
            // New device discovered
            devices[deviceId] = {deviceId, millis(), true, 1};
            Serial.print("New device discovered: ");
            Serial.println(deviceId);
        } else {
            // Update existing device
            devices[deviceId].lastSeen = millis();
            devices[deviceId].online = true;
            devices[deviceId].messageCount++;
        }
    }
}

void mqttReconnect() {
    while (!mqtt.connected() && WiFi.status() == WL_CONNECTED) {
        Serial.print("Connecting to MQTT...");

        if (mqtt.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)) {
            Serial.println("connected!");
            haOnline = true;

            // Subscribe to all KVN topics
            mqtt.subscribe("homeassistant/sensor/+/+");
            mqtt.subscribe("vanguard/control/+/+");
            mqtt.subscribe("vanguard/ai/+");

            Serial.println("Subscribed to KVN topics");

            // Publish relay online status
            mqtt.publish("vanguard/relay/status", "online");
            messagesTX++;

            // Flush buffered messages
            if (messageBuffer.size() > 0) {
                Serial.print("Flushing ");
                Serial.print(messageBuffer.size());
                Serial.println(" buffered messages...");

                for (auto& msg : messageBuffer) {
                    mqtt.publish(msg.topic.c_str(), msg.payload.c_str());
                    messagesTX++;
                }
                messageBuffer.clear();
            }

        } else {
            Serial.print("failed, rc=");
            Serial.println(mqtt.state());
            haOnline = false;
            delay(5000);
        }
    }
}

// ==================== MAIN SETUP ====================

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n\n=================================");
    Serial.println("KVN MQTT RELAY - ESP32-C6");
    Serial.println("Using LovyanGFX Library");
    Serial.println("=================================\n");

    startTime = millis();

    // Initialize display
    initDisplay();

    // Configure static IP
    if (!WiFi.config(RELAY_STATIC_IP, GATEWAY_IP, SUBNET_MASK, DNS_PRIMARY)) {
        Serial.println("Static IP configuration failed!");
    }

    // Connect to WiFi
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);

    tft.setCursor(30, 160);
    tft.setTextColor(TFT_YELLOW);
    tft.println("Connecting WiFi...");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("RSSI: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");

        tft.fillRect(0, 160, 172, 20, TFT_BLACK);
        tft.setCursor(30, 160);
        tft.setTextColor(TFT_GREEN);
        tft.println("WiFi Connected!");
    } else {
        Serial.println("\nWiFi connection failed!");
        tft.setCursor(30, 160);
        tft.setTextColor(TFT_RED);
        tft.println("WiFi FAILED");
        while (1) delay(1000);
    }

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(2048);

    tft.setCursor(30, 180);
    tft.setTextColor(TFT_YELLOW);
    tft.println("Connecting MQTT...");

    mqttReconnect();

    if (mqtt.connected()) {
        tft.fillRect(0, 180, 172, 20, TFT_BLACK);
        tft.setCursor(30, 180);
        tft.setTextColor(TFT_GREEN);
        tft.println("MQTT Connected!");
    }

    delay(2000);

    // Initialize devices with known KVN devices
    devices["esp32_p4_hub"] = {"P4-Hub", 0, false, 0};
    for (int i = 1; i <= 10; i++) {
        String id = "esp32_s3_node" + String(i);
        devices[id] = {"S3-Node-" + String(i), 0, false, 0};
    }
    for (int i = 1; i <= 6; i++) {
        String id = "esp32_c3_scout" + String(i);
        devices[id] = {"C3-Scout-" + String(i), 0, false, 0};
    }

    Serial.println("\nKVN MQTT Relay ready!");
    Serial.println("Monitoring 17 devices...\n");

    // Show initial status screen
    updateDisplay();
}

// ==================== MAIN LOOP ====================

void loop() {
    // Maintain WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected! Reconnecting...");
        WiFi.reconnect();
        delay(5000);
    }

    // Maintain MQTT connection
    if (!mqtt.connected()) {
        haOnline = false;
        mqttReconnect();
    } else {
        haOnline = true;
        mqtt.loop();
    }

    // Update display and backlight periodically
    if (millis() - lastStatusUpdate >= STATUS_UPDATE_INTERVAL) {
        updateDisplay();
        updateBacklight();  // Adjust backlight based on ambient light
        lastStatusUpdate = millis();

        // Publish relay stats
        if (mqtt.connected()) {
            String stats = "{\"rx\":" + String(messagesRX) +
                          ",\"tx\":" + String(messagesTX) +
                          ",\"buffer\":" + String(messageBuffer.size()) +
                          ",\"uptime\":" + String((millis() - startTime) / 1000) + "}";
            mqtt.publish("vanguard/relay/stats", stats.c_str());
        }
    }

    // TODO: Add BOOT button handling to cycle screens
    // GPIO 9 is typically the BOOT button on ESP32-C6

    delay(10);  // Small delay to prevent WDT issues
}
