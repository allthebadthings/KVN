#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "guy-fi";
const char* WIFI_PASSWORD = "";
const char* MQTT_HOST = "192.168.86.38";
const uint16_t MQTT_PORT = 1883;

#include "c3_config.h"

WiFiClient espClient;
PubSubClient mqtt(espClient);

String chipId() {
  uint64_t id = ESP.getEfuseMac();
  char buf[17];
  snprintf(buf, sizeof(buf), "%04X%08X", (uint32_t)(id>>32), (uint32_t)id);
  return String(buf);
}

String topicBase() {
  return String("vanguard/scout/") + chipId();
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(250);
    attempts++;
  }
}

void connectMQTT() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  uint8_t attempts = 0;
  while (!mqtt.connected() && attempts < 10) {
    String cid = String("c3-") + chipId();
    if (mqtt.connect(cid.c_str())) break;
    delay(500);
    attempts++;
  }
}

int readBatteryMilliVolts() {
  int raw = analogRead(BATTERY_ADC_PIN);
  return (int)((raw / 4095.0) * 3300);
}

void publishStatus() {
  String payload = String("{") +
    "\"node\":\"" + chipId() + "\"," +
    "\"battery_mv\":" + readBatteryMilliVolts() + "," +
    "\"uptime_ms\":" + millis() + "," +
    "\"online\":true" +
    "}";
  String topic = topicBase() + "/status";
  mqtt.publish(topic.c_str(), payload.c_str(), true);
}

void setup() {
  pinMode(SENSOR_POWER_PIN, OUTPUT);
  digitalWrite(SENSOR_POWER_PIN, HIGH);
  pinMode(BATTERY_ADC_PIN, INPUT);

  connectWiFi();
  connectMQTT();
  publishStatus();

  delay(2000);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  static uint32_t lastPub = 0;
  if (millis() - lastPub > 10000) {
    publishStatus();
    lastPub = millis();
  }
}
