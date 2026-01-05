/*
 * ESP32-P4 Hub with LDR Integration
 *
 * Master controller with ambient light sensing for:
 * - Web dashboard day/night mode
 * - System-wide light level coordination
 * - AI context enhancement
 * - Security mode automation
 *
 * Hardware:
 *   - ESP32-P4 Hub
 *   - 5528 LDR + 10kΩ voltage divider on GPIO 1
 *   - MQTT connection to broker
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>
#include "secrets.h"

// Pin configuration
#define HUB_LDR_PIN 1  // Adjust based on your P4 pinout

// Device identification
#define DEVICE_ID "esp32_p4_hub"
#define DEVICE_NAME "KVN Hub"

// MQTT topics
#define MQTT_TOPIC_AMBIENT "vanguard/hub/ambient_light"
#define MQTT_TOPIC_LUX "vanguard/hub/lux"
#define MQTT_TOPIC_DAY_MODE "vanguard/hub/day_mode"
#define MQTT_TOPIC_SYSTEM_MODE "vanguard/system/mode"
#define MQTT_TOPIC_SYSTEM_EVENT "vanguard/system/event"

// Timing
unsigned long lastMQTTPublish = 0;
const unsigned long MQTT_PUBLISH_INTERVAL = 60000; // 1 minute

// Network clients
WiFiClient espClient;
PubSubClient mqtt(espClient);

// LDR sensor
KVN_LDR hubLight(HUB_LDR_PIN);

// State tracking
bool wasDay = true;
int darkRoomCount = 0;
int totalRooms = 17; // All non-hub devices

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32-P4 Hub with LDR Integration ===\n");

    // Initialize LDR
    hubLight.begin();

    // Optional: Auto-calibrate on first boot
    // Uncomment to run calibration:
    // hubLight.autoCalibrate();

    Serial.println("LDR initialized on GPIO " + String(HUB_LDR_PIN));

    // Connect to WiFi
    connectWiFi();

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);

    Serial.println("\nHub ready!");
    Serial.println("Publishing master light level to MQTT\n");
}

void loop() {
    // Maintain connections
    if (!mqtt.connected()) {
        reconnectMQTT();
    }
    mqtt.loop();

    // Publish light data periodically or on significant change
    if (hubLight.hasChanged(200) || (millis() - lastMQTTPublish > MQTT_PUBLISH_INTERVAL)) {
        publishLightData();
        lastMQTTPublish = millis();
    }

    // Detect sunrise/sunset
    bool isDay = hubLight.isDay(1500);
    if (wasDay != isDay) {
        if (isDay) {
            Serial.println("☀️ Sunrise detected!");
            mqtt.publish(MQTT_TOPIC_SYSTEM_EVENT, "sunrise");
            // Trigger morning routine
            // - Disable night mode
            // - Resume full sensor polling
        } else {
            Serial.println("🌙 Sunset detected!");
            mqtt.publish(MQTT_TOPIC_SYSTEM_EVENT, "sunset");
            // Trigger evening routine
            // - Enable night mode
            // - Reduce polling frequency
        }
        wasDay = isDay;
    }

    // Debug output
    static unsigned long lastDebug = 0;
    if (millis() - lastDebug > 5000) {
        hubLight.printDebug();
        Serial.println();
        lastDebug = millis();
    }

    delay(100);
}

void connectWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
}

void reconnectMQTT() {
    while (!mqtt.connected()) {
        Serial.print("Connecting to MQTT...");

        if (mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
            Serial.println(" connected!");

            // Subscribe to device light levels
            mqtt.subscribe("vanguard/+/ambient_light");
            mqtt.subscribe("homeassistant/sensor/+/lux");

            // Publish online status
            mqtt.publish("vanguard/hub/status", "online", true);

        } else {
            Serial.print(" failed, rc=");
            Serial.println(mqtt.state());
            delay(5000);
        }
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Parse incoming light levels from other devices
    String message = "";
    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    // Track dark rooms for system-wide night mode
    if (String(topic).indexOf("/lux") > 0) {
        int lux = message.toInt();

        // Count dark rooms (this is simplified - you'd track per device)
        if (lux < 50) {
            // Room is dark
        }

        // If ALL rooms are dark, enable security mode
        if (darkRoomCount == totalRooms && hubLight.getLux() < 50) {
            mqtt.publish(MQTT_TOPIC_SYSTEM_MODE, "night_security");

            // Enable security features:
            // - Arm motion sensors
            // - Enable camera recording
            // - Disable notification sounds
            // - Reduce LED brightness
        }
    }
}

void publishLightData() {
    // Publish full JSON
    String json = hubLight.toJSON();
    mqtt.publish(MQTT_TOPIC_AMBIENT, json.c_str());

    // Publish individual values
    mqtt.publish(MQTT_TOPIC_LUX, String(hubLight.getLux()).c_str());
    mqtt.publish(MQTT_TOPIC_DAY_MODE, hubLight.isDay() ? "true" : "false");

    // Send AI context (if AI integration enabled)
    String aiContext = buildAIContext();
    if (aiContext.length() > 0) {
        mqtt.publish("vanguard/ai/context/light", aiContext.c_str());
    }

    Serial.print("Published: ");
    Serial.println(json);
}

String buildAIContext() {
    String context = "";

    context += "Hub ambient light: " + String(hubLight.getLux()) + " lux. ";
    context += hubLight.isDay() ? "Daytime conditions." : "Nighttime conditions.";

    // Add light level description
    uint8_t level = hubLight.getLightLevel();
    switch (level) {
        case 0: context += " Very dark."; break;
        case 1: context += " Dim lighting."; break;
        case 2: context += " Normal lighting."; break;
        case 3: context += " Bright lighting."; break;
        case 4: context += " Very bright."; break;
    }

    return context;
}
