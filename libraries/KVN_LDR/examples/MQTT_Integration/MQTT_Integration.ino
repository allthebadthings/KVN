/*
 * KVN_LDR MQTT Integration Example
 *
 * Publishes ambient light data to MQTT broker
 * Only publishes when light level changes significantly
 *
 * Hardware:
 *   - 5528 LDR + 10kΩ voltage divider on LDR_PIN
 *   - WiFi connection required
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>

// WiFi credentials
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// MQTT configuration
#define MQTT_BROKER "192.168.86.38"
#define MQTT_PORT 1883
#define MQTT_USER "mqtt-ha"
#define MQTT_PASS "your-mqtt-password"

// Device ID (use ESP32 MAC address or unique name)
String deviceId = "esp32_" + String((uint32_t)ESP.getEfuseMac(), HEX);

// Pin configuration
#define LDR_PIN 0

// MQTT client
WiFiClient espClient;
PubSubClient mqtt(espClient);

// LDR sensor
KVN_LDR ldr(LDR_PIN);

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n=== KVN LDR MQTT Integration ===\n");

    // Initialize LDR
    ldr.begin();

    // Connect to WiFi
    Serial.print("Connecting to WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println(" Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);

    Serial.println("\nReady to publish light data!");
}

void reconnectMQTT() {
    while (!mqtt.connected()) {
        Serial.print("Connecting to MQTT...");

        if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
            Serial.println(" connected!");

            // Publish online status
            String topic = "homeassistant/sensor/" + deviceId + "/status";
            mqtt.publish(topic.c_str(), "online");

        } else {
            Serial.print(" failed, rc=");
            Serial.println(mqtt.state());
            delay(5000);
        }
    }
}

void loop() {
    // Maintain MQTT connection
    if (!mqtt.connected()) {
        reconnectMQTT();
    }
    mqtt.loop();

    // Check if light level changed significantly
    if (ldr.hasChanged(200)) {  // Threshold: 200 ADC units
        // Publish to MQTT
        String topic = "homeassistant/sensor/" + deviceId + "/ambient_light";
        String payload = ldr.toJSON();

        Serial.print("Publishing: ");
        Serial.println(payload);

        mqtt.publish(topic.c_str(), payload.c_str());

        // Also publish individual values for Home Assistant auto-discovery
        String luxTopic = "homeassistant/sensor/" + deviceId + "/lux";
        mqtt.publish(luxTopic.c_str(), String(ldr.getLux()).c_str());
    }

    delay(1000);  // Check every second
}
