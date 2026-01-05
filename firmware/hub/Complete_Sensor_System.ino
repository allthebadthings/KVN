#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "secrets.h"
#include "hub_config.h"
#include <ESP32_AI.h>

WiFiClient espClient;
PubSubClient client(espClient);
ESP32_AI ai(ANTHROPIC_API_KEY, "anthropic");

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32P4Hub", MQTT_USER, MQTT_PASSWORD)) {
      Serial.println("connected");
      client.subscribe("vanguard/#");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Initialize UARTs for Radars
  Serial1.begin(115200, SERIAL_8N1, UART1_RX, UART1_TX);
  Serial2.begin(115200, SERIAL_8N1, UART2_RX, UART2_TX);
  
  setup_wifi();
  
  client.setServer(MQTT_SERVER, MQTT_PORT);
  
  // Initialize AI
  ai.begin();
  Serial.println("AI System Initialized");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Main Hub Logic Placeholder
  delay(100);
}