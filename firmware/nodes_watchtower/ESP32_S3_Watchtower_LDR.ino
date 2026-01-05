/*
 * ESP32-S3 Watchtower with LDR Integration
 *
 * Per-room environmental monitoring with:
 * - Auto-brightness for OLED/LCD displays
 * - Room light level tracking
 * - Occupancy correlation (lights on = room active)
 * - Window vs. interior detection
 *
 * Hardware:
 *   - ESP32-S3 Watchtower board
 *   - 5528 LDR + 10kΩ voltage divider on GPIO 1
 *   - OLED/LCD display with backlight on GPIO 10
 *   - MQTT connection to broker
 *
 * NOTE: Adjust NODE_NUMBER (1-10) for each deployed Watchtower
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>
#include "secrets.h"

// Node configuration - CHANGE THIS FOR EACH DEVICE!
#define NODE_NUMBER 1  // 1-10 for different rooms

// Pin configuration
#define S3_LDR_PIN 1        // LDR analog input
#define S3_DISPLAY_BL 10    // Display backlight PWM

// Room names (customize per deployment)
const char* ROOM_NAMES[] = {
    "Unknown",
    "Living Room",  // Node 1
    "Bedroom",      // Node 2
    "Kitchen",      // Node 3
    "Office",       // Node 4
    "Bathroom",     // Node 5
    "Hallway",      // Node 6
    "Garage",       // Node 7
    "Basement",     // Node 8
    "Attic",        // Node 9
    "Guest Room"    // Node 10
};

// Device identification
String deviceId = "esp32_s3_node" + String(NODE_NUMBER);
String deviceName = String(ROOM_NAMES[NODE_NUMBER]);

// MQTT topics
String mqttTopicLux;
String mqttTopicAmbient;
String mqttTopicRoomEvent;
String mqttTopicStatus;

// Timing
unsigned long lastMQTTPublish = 0;
const unsigned long MQTT_PUBLISH_INTERVAL = 60000; // 1 minute

// Network clients
WiFiClient espClient;
PubSubClient mqtt(espClient);

// LDR sensor
KVN_LDR roomLight(S3_LDR_PIN);

// Occupancy detection state
bool wasLightOn = false;
unsigned long lightOnTime = 0;
unsigned long lightOffTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n=== ESP32-S3 Watchtower Node " + String(NODE_NUMBER) + " ===");
    Serial.println("Room: " + deviceName + "\n");

    // Initialize LDR
    roomLight.begin();
    Serial.println("LDR initialized on GPIO " + String(S3_LDR_PIN));

    // Setup display backlight
    pinMode(S3_DISPLAY_BL, OUTPUT);
    analogWrite(S3_DISPLAY_BL, 128); // Initial 50% brightness
    Serial.println("Display backlight on GPIO " + String(S3_DISPLAY_BL));

    // Build MQTT topics
    mqttTopicLux = "homeassistant/sensor/" + deviceId + "/lux";
    mqttTopicAmbient = "homeassistant/sensor/" + deviceId + "/ambient_light";
    mqttTopicRoomEvent = "vanguard/s3/" + deviceName + "/event";
    mqttTopicStatus = "homeassistant/sensor/" + deviceId + "/status";

    // Connect to WiFi
    connectWiFi();

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);

    Serial.println("\nWatchtower ready!");
    Serial.println("Monitoring " + deviceName + " light levels\n");
}

void loop() {
    // Maintain MQTT connection
    if (!mqtt.connected()) {
        reconnectMQTT();
    }
    mqtt.loop();

    // Auto-brightness for display
    updateDisplayBrightness();

    // Publish light data on change or periodically
    if (roomLight.hasChanged(150) || (millis() - lastMQTTPublish > MQTT_PUBLISH_INTERVAL)) {
        publishLightData();
        lastMQTTPublish = millis();
    }

    // Detect room occupancy changes
    detectOccupancy();

    // Debug output
    static unsigned long lastDebug = 0;
    if (millis() - lastDebug > 5000) {
        Serial.print("[" + deviceName + "] ");
        roomLight.printDebug();
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

        if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
            Serial.println(" connected!");

            // Publish online status
            mqtt.publish(mqttTopicStatus.c_str(), "online", true);

            // Publish Home Assistant auto-discovery
            publishDiscovery();

        } else {
            Serial.print(" failed, rc=");
            Serial.println(mqtt.state());
            delay(5000);
        }
    }
}

void updateDisplayBrightness() {
    // Get auto-brightness value (20-255 range, with gamma correction)
    uint8_t brightness = roomLight.getBrightness(20, 255, true);

    // Apply to backlight
    analogWrite(S3_DISPLAY_BL, brightness);
}

void publishLightData() {
    // Publish full JSON to ambient_light topic
    String json = roomLight.toJSON();
    mqtt.publish(mqttTopicAmbient.c_str(), json.c_str());

    // Publish lux value to individual topic (Home Assistant)
    mqtt.publish(mqttTopicLux.c_str(), String(roomLight.getLux()).c_str());

    Serial.print("[" + deviceName + "] Published: ");
    Serial.println(json);
}

void detectOccupancy() {
    // Room light threshold (adjust based on room)
    const uint16_t LIGHT_ON_THRESHOLD = 100; // lux

    bool isLightOn = roomLight.getLux() > LIGHT_ON_THRESHOLD;

    // Light just turned on
    if (isLightOn && !wasLightOn) {
        lightOnTime = millis();

        Serial.println("[" + deviceName + "] Room lights activated");
        mqtt.publish(mqttTopicRoomEvent.c_str(), "lights_on");

        // Possible interpretations:
        // - Someone entered the room
        // - Morning wake-up
        // - Natural daylight (if window room)
    }

    // Light just turned off
    if (!isLightOn && wasLightOn) {
        lightOffTime = millis();

        unsigned long durationMinutes = (lightOffTime - lightOnTime) / 60000;

        Serial.println("[" + deviceName + "] Room lights deactivated");
        Serial.println("Duration: " + String(durationMinutes) + " minutes");

        mqtt.publish(mqttTopicRoomEvent.c_str(), "lights_off");

        // Possible interpretations:
        // - Room vacated
        // - Going to sleep
        // - Sunset (if window room)
    }

    wasLightOn = isLightOn;
}

void publishDiscovery() {
    // Home Assistant MQTT Discovery for lux sensor
    String discoveryTopic = "homeassistant/sensor/" + deviceId + "_lux/config";

    String discoveryPayload = "{";
    discoveryPayload += "\"name\":\"" + deviceName + " Light\",";
    discoveryPayload += "\"stat_t\":\"" + mqttTopicLux + "\",";
    discoveryPayload += "\"unit_of_meas\":\"lx\",";
    discoveryPayload += "\"dev_cla\":\"illuminance\",";
    discoveryPayload += "\"uniq_id\":\"" + deviceId + "_lux\",";
    discoveryPayload += "\"device\":{";
    discoveryPayload += "\"identifiers\":[\"" + deviceId + "\"],";
    discoveryPayload += "\"name\":\"" + deviceName + " Watchtower\",";
    discoveryPayload += "\"model\":\"ESP32-S3 Watchtower\",";
    discoveryPayload += "\"manufacturer\":\"KVN System\"";
    discoveryPayload += "}}";

    mqtt.publish(discoveryTopic.c_str(), discoveryPayload.c_str(), true);

    Serial.println("Published Home Assistant discovery");
}
