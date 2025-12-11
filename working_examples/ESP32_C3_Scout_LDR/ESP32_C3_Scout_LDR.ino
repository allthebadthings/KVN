/*
 * ESP32-C3 Scout with LDR Integration (Ultra-Low Power)
 *
 * Battery-powered motion sensor with intelligent power management:
 * - Deep sleep during daylight hours (1 hour intervals)
 * - Active motion detection at night (5 minute intervals)
 * - Window curtain/blind detection
 * - 2-3× battery life extension
 *
 * Hardware:
 *   - ESP32-C3 Scout board
 *   - 5528 LDR + 10kΩ voltage divider on GPIO 0
 *   - PIR motion sensor (optional)
 *   - Battery power (1000-2000mAh recommended)
 *
 * NOTE: Adjust SCOUT_NUMBER (1-6) for each deployed Scout
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <KVN_LDR.h>
#include "secrets.h"

// Scout configuration - CHANGE THIS FOR EACH DEVICE!
#define SCOUT_NUMBER 1  // 1-6 for different locations

// Pin configuration
#define C3_LDR_PIN 0         // LDR analog input
#define C3_PIR_PIN 2         // PIR motion sensor (optional)
#define C3_STATUS_LED 8      // Status LED (built-in on many C3 boards)

// Power management
#define SLEEP_DURATION_DAY   3600  // 1 hour in daylight (seconds)
#define SLEEP_DURATION_NIGHT  300  // 5 minutes at night (seconds)
#define DAY_THRESHOLD        1500  // ADC threshold for daytime

// Scout location names (customize per deployment)
const char* SCOUT_LOCATIONS[] = {
    "Unknown",
    "Front Door",     // Scout 1
    "Back Door",      // Scout 2
    "Living Window",  // Scout 3
    "Bedroom Window", // Scout 4
    "Garage",         // Scout 5
    "Basement Stairs" // Scout 6
};

// Device identification
String deviceId = "esp32_c3_scout" + String(SCOUT_NUMBER);
String deviceName = String(SCOUT_LOCATIONS[SCOUT_NUMBER]);

// RTC memory (survives deep sleep)
RTC_DATA_ATTR int bootCount = 0;
RTC_DATA_ATTR uint16_t lastLuxValue = 0;

// Network clients
WiFiClient espClient;
PubSubClient mqtt(espClient);

// LDR sensor
KVN_LDR scoutLight(C3_LDR_PIN);

void setup() {
    Serial.begin(115200);
    delay(100);

    bootCount++;

    Serial.println("\n=== ESP32-C3 Scout " + String(SCOUT_NUMBER) + " ===");
    Serial.println("Location: " + deviceName);
    Serial.println("Boot #" + String(bootCount) + "\n");

    // Initialize LDR
    scoutLight.begin();

    // Setup status LED
    pinMode(C3_STATUS_LED, OUTPUT);
    digitalWrite(C3_STATUS_LED, HIGH); // LED on during active period

    // Check if it's daytime
    uint16_t currentLux = scoutLight.getLux();
    bool isDay = scoutLight.isDay(DAY_THRESHOLD);

    Serial.print("Current light: ");
    Serial.print(currentLux);
    Serial.println(" lux");

    if (isDay) {
        // DAYTIME - Go to deep sleep for 1 hour
        Serial.println("☀️ Daytime detected - sleeping for 1 hour");
        Serial.println("Power saving mode active\n");

        digitalWrite(C3_STATUS_LED, LOW); // LED off

        // Quick MQTT update (optional - comment out to save more power)
        if (connectQuick()) {
            publishLightData();
            mqtt.disconnect();
        }

        // Deep sleep for 1 hour
        esp_sleep_enable_timer_wakeup(SLEEP_DURATION_DAY * 1000000ULL);
        esp_deep_sleep_start();
    }

    // NIGHTTIME - Proceed with motion detection
    Serial.println("🌙 Nighttime - motion detection active");

    // Connect to WiFi
    connectWiFi();

    // Setup MQTT
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);

    if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
        Serial.println("MQTT connected");

        // Publish boot status
        String topic = "vanguard/scout/" + deviceName + "/status";
        mqtt.publish(topic.c_str(), "online");

        // Publish light data
        publishLightData();

        // Check for window curtain changes
        detectCurtainState();
    }

    // Setup PIR sensor (if connected)
    pinMode(C3_PIR_PIN, INPUT);

    Serial.println("\nMonitoring for motion...\n");
}

void loop() {
    // Maintain MQTT connection
    if (!mqtt.connected()) {
        // Don't spend too long reconnecting - save battery
        if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
            Serial.println("MQTT reconnected");
        }
    }
    mqtt.loop();

    // Monitor motion sensor
    static unsigned long lastMotion = 0;
    bool motionDetected = digitalRead(C3_PIR_PIN);

    if (motionDetected && (millis() - lastMotion > 10000)) {
        Serial.println("🚨 Motion detected!");

        String topic = "vanguard/scout/" + deviceName + "/motion";
        mqtt.publish(topic.c_str(), "detected");

        lastMotion = millis();

        // Flash LED
        for (int i = 0; i < 3; i++) {
            digitalWrite(C3_STATUS_LED, LOW);
            delay(100);
            digitalWrite(C3_STATUS_LED, HIGH);
            delay(100);
        }
    }

    // Publish light updates if changed significantly
    static unsigned long lastPublish = 0;
    if (scoutLight.hasChanged(200) && (millis() - lastPublish > 60000)) {
        publishLightData();
        lastPublish = millis();
    }

    // Check if dawn - go back to sleep
    if (scoutLight.isDay(DAY_THRESHOLD)) {
        Serial.println("☀️ Dawn detected - entering sleep mode");

        digitalWrite(C3_STATUS_LED, LOW);

        esp_sleep_enable_timer_wakeup(SLEEP_DURATION_DAY * 1000000ULL);
        esp_deep_sleep_start();
    }

    // After 5 minutes of operation, sleep briefly to save battery
    if (millis() > SLEEP_DURATION_NIGHT * 1000) {
        Serial.println("Night cycle complete - sleeping for 5 minutes");

        mqtt.disconnect();
        WiFi.disconnect();
        digitalWrite(C3_STATUS_LED, LOW);

        esp_sleep_enable_timer_wakeup(SLEEP_DURATION_NIGHT * 1000000ULL);
        esp_deep_sleep_start();
    }

    delay(100);
}

void connectWiFi() {
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" Connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(" Failed! Continuing offline");
    }
}

bool connectQuick() {
    // Quick WiFi + MQTT connection for daytime updates
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    for (int i = 0; i < 10; i++) {
        if (WiFi.status() == WL_CONNECTED) {
            mqtt.setServer(MQTT_BROKER, MQTT_PORT);
            if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
                return true;
            }
        }
        delay(500);
    }

    return false;
}

void publishLightData() {
    String topicLux = "homeassistant/sensor/" + deviceId + "/lux";
    String topicAmbient = "homeassistant/sensor/" + deviceId + "/ambient_light";

    // Publish lux value
    mqtt.publish(topicLux.c_str(), String(scoutLight.getLux()).c_str());

    // Publish full JSON
    String json = scoutLight.toJSON();
    mqtt.publish(topicAmbient.c_str(), json.c_str());

    Serial.print("[" + deviceName + "] Published: ");
    Serial.println(json);

    lastLuxValue = scoutLight.getLux();
}

void detectCurtainState() {
    // Window curtain/blind detection (for window-mounted scouts)
    uint16_t lux = scoutLight.getLux();

    String topic = "vanguard/scout/" + deviceName + "/window_status";

    if (lux > 500) {
        // Bright - curtains open
        mqtt.publish(topic.c_str(), "curtains_open");
        Serial.println("Window status: Curtains OPEN");

    } else if (lux < 50 && scoutLight.isDay()) {
        // Dark during daytime - curtains closed
        mqtt.publish(topic.c_str(), "curtains_closed");
        Serial.println("Window status: Curtains CLOSED");

    } else {
        // Indeterminate
        mqtt.publish(topic.c_str(), "unknown");
    }
}

/*
 * Battery Life Calculation:
 *
 * WITHOUT LDR (24/7 active):
 *   - Current draw: ~80mA
 *   - Battery: 1000mAh
 *   - Runtime: ~12.5 hours
 *
 * WITH LDR (sleep in day):
 *   - Daytime (12h): Deep sleep @ 10µA
 *   - Nighttime (12h): Active @ 80mA + sleep cycles
 *   - Average current: ~35mA
 *   - Battery: 1000mAh
 *   - Runtime: ~28 hours (2.2× longer!)
 *
 * WITH LARGER BATTERY (2000mAh):
 *   - Runtime: ~56 hours (~2.3 days)
 */
