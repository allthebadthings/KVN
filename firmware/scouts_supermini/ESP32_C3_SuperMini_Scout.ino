/*
 * ESP32-C3 SuperMini Scout
 *
 * Configuration Source: config-esp32-c3-supermini.json
 *
 * Hardware Pinout (Functional Mapping):
 * - Radar (UART): RX=20, TX=21
 * - Primary Sensor Bus (I2C): SDA=8, SCL=9
 * - Secondary Sensor Bus (I2C): SDA=3, SCL=4
 * - Status LED: GPIO 2
 */

#include "../secrets.h"
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>

// --- Pin Definitions (Functional Names) ---

// Radar Unit (UART)
// Note: JSON defines UART-TX as 21, UART-RX as 20.
// We connect ESP RX to Radar TX, ESP TX to Radar RX.
#define PIN_RADAR_RX 20
#define PIN_RADAR_TX 21

// Primary Sensor Bus (e.g., Light, Env)
#define PIN_SENSOR_SDA 8
#define PIN_SENSOR_SCL 9

// Secondary Sensor Bus (Auxiliary)
#define PIN_AUX_SDA 3
#define PIN_AUX_SCL 4

// Status Indicator
#define PIN_STATUS_LED 2

// --- System Configuration ---
#define REPORT_INTERVAL_MS 10000

// --- Globals ---
WiFiClient espClient;
PubSubClient mqtt(espClient);
String deviceId;
String topicBase;

TwoWire SensorBus = TwoWire(0);
TwoWire AuxBus = TwoWire(1);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
  }
  digitalWrite(PIN_STATUS_LED, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi failed. Running in offline mode.");
  }
}

void reconnect() {
  while (!mqtt.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (mqtt.connect(deviceId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");
      mqtt.publish((topicBase + "/status").c_str(), "online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void scanI2C(TwoWire &wirePort, String busName) {
  byte error, address;
  int nDevices = 0;

  Serial.println("Scanning " + busName + "...");

  for (address = 1; address < 127; address++) {
    wirePort.beginTransmission(address);
    error = wirePort.endTransmission();

    if (error == 0) {
      Serial.print("Device found at 0x");
      if (address < 16)
        Serial.print("0");
      Serial.println(address, HEX);
      nDevices++;

      if (mqtt.connected()) {
        String payload = "{\"bus\":\"" + busName + "\",\"address\":\"0x" +
                         String(address, HEX) + "\"}";
        mqtt.publish((topicBase + "/discovery").c_str(), payload.c_str());
      }
    }
  }
  if (nDevices == 0)
    Serial.println("No devices found.\n");
  else
    Serial.println("done\n");
}

void setup() {
  // 1. Initialize Serial
  Serial.begin(115200);
  delay(1000);
  Serial.println("ESP32-C3 SuperMini Scout Starting...");

  // 2. Initialize Status LED
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, HIGH); // On during setup

  // 3. Initialize Radar UART
  // Connect Radar TX to ESP RX (20) and Radar RX to ESP TX (21)
  Serial1.begin(115200, SERIAL_8N1, PIN_RADAR_RX, PIN_RADAR_TX);
  Serial.println("Radar UART Initialized");

  // 4. Initialize I2C Buses
  SensorBus.begin(PIN_SENSOR_SDA, PIN_SENSOR_SCL, 100000);
  Serial.println("Primary Sensor Bus Initialized");

  AuxBus.begin(PIN_AUX_SDA, PIN_AUX_SCL, 100000);
  Serial.println("Aux Sensor Bus Initialized");

  // 5. Identity
  uint64_t mac = ESP.getEfuseMac();
  deviceId = "scout-c3-" + String((uint32_t)(mac >> 32), HEX) +
             String((uint32_t)mac, HEX);
  topicBase = "vanguard/scout/" + deviceId;

  Serial.print("Device ID: ");
  Serial.println(deviceId);

  // 6. Connect
  setup_wifi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqtt.connected()) {
      reconnect();
    }
    mqtt.loop();
  }

  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > REPORT_INTERVAL_MS) {
    lastMsg = now;

    // Blink Heartbeat
    digitalWrite(PIN_STATUS_OUT, HIGH);
    delay(50);
    digitalWrite(PIN_STATUS_OUT, LOW);

    // Publish Uptime
    if (mqtt.connected()) {
      String uptime = String(millis() / 1000);
      mqtt.publish((topicBase + "/uptime").c_str(), uptime.c_str());
    }

    // Check for Sensors
    scanI2C(SensorBus, "PrimaryBus");
    scanI2C(AuxBus, "AuxBus");
  }

  // Read Radar
  if (Serial1.available()) {
    // Pass through radar data handling here
    // For now just clear buffer
    while (Serial1.available())
      Serial1.read();
  }
}
