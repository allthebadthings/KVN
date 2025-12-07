# AI Coordinator System - Network & API Configuration Guide

**Last Updated:** 2025-12-07
**System:** Vanguard AI Coordinator (17-device fleet)

---

## 🌐 NETWORK ARCHITECTURE OVERVIEW

```
Internet
    ↓
Router (192.168.86.1)
    ↓
├── ESP32-P4 Hub (192.168.1.100) ← Static IP
│   ↓
├── ESP32-S3 Node #1 (192.168.86.x) ← DHCP
├── ESP32-S3 Node #2-10...
├── ESP32-C3 Scout #1 (192.168.86.x) ← DHCP
├── ESP32-C3 Scout #2-6...
│
└── MQTT Broker (192.168.86.38) ← Home Assistant
```

---

## 📡 WiFi CONFIGURATION

### Primary Network

**SSID:** `guy-fi`
**Password:** `244466666`
**Subnet:** `192.168.86.x`
**Frequency:** 2.4GHz (ESP32-C3/S3) + 5GHz/6GHz (ESP32-P4)
**Security:** WPA3 (or WPA2 for compatibility)

### Fallback Network

**SSID:** `FondleMyDongle`
**Password:** `244466669`
**Subnet:** `192.168.84.x`
**Purpose:** Backup if primary network fails

### Frequency Band Requirements

**CRITICAL:**
- **ESP32-P4 Hub:** Can use WiFi 6 (2.4GHz / 5GHz / 6GHz)
- **ESP32-S3 Nodes:** 2.4GHz ONLY
- **ESP32-C3 Scouts:** 2.4GHz ONLY

**⚠️ DO NOT configure C3/S3 devices on 5GHz networks - they will not connect!**

---

## 🔌 STATIC IP CONFIGURATION

### ESP32-P4 Hub (The Brain)

**Recommended IP:** `192.168.1.100` or `192.168.86.100` (adjust to match subnet)

#### Option A: Static IP in Router (Recommended)

**Why?** Survives firmware reflashing, easier to manage

1. Find P4 MAC address:
   ```cpp
   // In Arduino Serial Monitor after boot:
   Serial.println(WiFi.macAddress());
   // Example output: A0:B1:C2:D3:E4:F5
   ```

2. Log into router admin panel (usually http://192.168.86.1)

3. Navigate to: DHCP Settings → Static IP Reservations

4. Add reservation:
   - MAC Address: `A0:B1:C2:D3:E4:F5`
   - IP Address: `192.168.1.100`
   - Hostname: `vanguard-hub`

5. Save and reboot router

#### Option B: Static IP in ESP32 Code

```cpp
// In your main sketch setup()
#include <WiFi.h>

// Define static IP configuration
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 86, 1);      // Your router IP
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);        // Google DNS
IPAddress secondaryDNS(8, 8, 4, 4);

void setup() {
    // Configure static IP BEFORE WiFi.begin()
    if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
        Serial.println("Static IP Failed!");
    }

    // Connect to WiFi
    WiFi.begin("guy-fi", "244466666");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.print("Hub IP: ");
    Serial.println(WiFi.localIP());
}
```

### ESP32-S3 & ESP32-C3 Nodes

**Use DHCP** - Let router assign dynamic IPs

**Why?**
- Easier deployment (no manual IP configuration)
- Nodes report to Hub via MQTT (Hub needs static IP, nodes don't)
- Reduces configuration errors

---

## 📨 MQTT BROKER SETUP

### Broker Details

**Server:** `192.168.86.38` (Home Assistant server)
**Port:** `1883` (default MQTT port)
**Username:** `mqtt-ha`
**Password:** `dskjdfs98ewrkljh3`
**Protocol:** MQTT v3.1.1

### Topic Structure

**Sensor Data (Node → Hub):**
```
homeassistant/sensor/esp32_XXXXXX/state
homeassistant/sensor/esp32_XXXXXX/temperature
homeassistant/sensor/esp32_XXXXXX/occupancy
homeassistant/sensor/esp32_XXXXXX/motion
```
*Where `XXXXXX` is the unique device ID (e.g., last 6 digits of MAC address)*

**Control Commands (Hub → Node):**
```
vanguard/control/esp32_XXXXXX/light
vanguard/control/esp32_XXXXXX/display
```

**AI Insights (Hub → Dashboard):**
```
vanguard/ai/insights
vanguard/ai/alerts
```

### MQTT Code Implementation

#### ESP32 Nodes (Publishing Sensor Data)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient mqtt(espClient);

const char* mqtt_server = "192.168.86.38";
const int mqtt_port = 1883;
const char* mqtt_user = "mqtt-ha";
const char* mqtt_pass = "dskjdfs98ewrkljh3";

void reconnect() {
    while (!mqtt.connected()) {
        Serial.print("Connecting to MQTT...");
        String clientId = "ESP32-" + String(ESP.getEfuseMac(), HEX);

        if (mqtt.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
            Serial.println("connected");
        } else {
            Serial.print("failed, rc=");
            Serial.print(mqtt.state());
            delay(5000);
        }
    }
}

void setup() {
    WiFi.begin("guy-fi", "244466666");
    mqtt.setServer(mqtt_server, mqtt_port);
}

void loop() {
    if (!mqtt.connected()) {
        reconnect();
    }
    mqtt.loop();

    // Publish sensor data
    String topic = "homeassistant/sensor/esp32_" + String(ESP.getEfuseMac(), HEX) + "/temperature";
    String payload = String(readTemperature());
    mqtt.publish(topic.c_str(), payload.c_str());

    delay(5000); // Publish every 5 seconds
}
```

#### ESP32-P4 Hub (Subscribing to All Nodes)

```cpp
void setup() {
    mqtt.setServer(mqtt_server, mqtt_port);
    mqtt.setCallback(callback);
}

void callback(char* topic, byte* payload, unsigned int length) {
    Serial.print("Message received on ");
    Serial.println(topic);

    // Parse sensor data
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    // Extract device ID from topic
    String topicStr = String(topic);
    int deviceIdStart = topicStr.indexOf("esp32_") + 6;
    int deviceIdEnd = topicStr.indexOf("/", deviceIdStart);
    String deviceId = topicStr.substring(deviceIdStart, deviceIdEnd);

    // Update dashboard or trigger AI analysis
    updateDashboard(deviceId, message);
}

void reconnect() {
    if (mqtt.connect("VanguardHub", mqtt_user, mqtt_pass)) {
        // Subscribe to all sensor topics
        mqtt.subscribe("homeassistant/sensor/+/+");
    }
}
```

---

## 🤖 AI API CONFIGURATION

### Anthropic Claude (Recommended)

**Why Claude?**
- Fast inference (100-200ms)
- Cost-effective (~$0.03/day for 1000 queries)
- Excellent at contextual home automation logic

**Setup Steps:**

1. **Get API Key:**
   - Visit: https://console.anthropic.com
   - Sign up / Log in
   - Navigate to: API Keys → Create Key
   - Copy key starting with `sk-ant-...`

2. **Add to secrets.h:**
   ```cpp
   // secrets.h
   #define ANTHROPIC_API_KEY "sk-ant-api03-YOUR_KEY_HERE"
   ```

3. **API Call Example:**
   ```cpp
   #include <HTTPClient.h>
   #include <ArduinoJson.h>

   String callClaudeAPI(String prompt) {
       HTTPClient http;
       http.begin("https://api.anthropic.com/v1/messages");
       http.addHeader("Content-Type", "application/json");
       http.addHeader("x-api-key", ANTHROPIC_API_KEY);
       http.addHeader("anthropic-version", "2023-06-01");

       // Build request
       StaticJsonDocument<1024> doc;
       doc["model"] = "claude-3-haiku-20240307"; // Fastest, cheapest
       doc["max_tokens"] = 256;

       JsonArray messages = doc.createNestedArray("messages");
       JsonObject message = messages.createNestedObject();
       message["role"] = "user";
       message["content"] = prompt;

       String requestBody;
       serializeJson(doc, requestBody);

       int httpCode = http.POST(requestBody);
       String response = http.getString();
       http.end();

       // Parse response
       StaticJsonDocument<2048> responseDoc;
       deserializeJson(responseDoc, response);
       String aiResponse = responseDoc["content"][0]["text"];

       return aiResponse;
   }

   void loop() {
       // Example: Analyze temperature anomaly
       String prompt = "Master Bedroom is 76°F, Living Room is 68°F. Should I adjust HVAC? Reply in one sentence.";
       String aiInsight = callClaudeAPI(prompt);
       Serial.println(aiInsight);
   }
   ```

### OpenAI GPT (Backup Option)

**Setup:**
1. Visit: https://platform.openai.com
2. API Keys → Create secret key
3. Copy key starting with `sk-...`

**Code:**
```cpp
#define OPENAI_API_KEY "sk-YOUR_KEY_HERE"

String callGPTAPI(String prompt) {
    HTTPClient http;
    http.begin("https://api.openai.com/v1/chat/completions");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + String(OPENAI_API_KEY));

    StaticJsonDocument<1024> doc;
    doc["model"] = "gpt-4o-mini"; // Cost-effective model
    doc["max_tokens"] = 256;

    JsonArray messages = doc.createNestedArray("messages");
    JsonObject message = messages.createNestedObject();
    message["role"] = "user";
    message["content"] = prompt;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    StaticJsonDocument<2048> responseDoc;
    deserializeJson(responseDoc, response);
    String aiResponse = responseDoc["choices"][0]["message"]["content"];

    return aiResponse;
}
```

### Google Gemini Flash (Free Tier)

**Setup:**
1. Visit: https://aistudio.google.com
2. Get API Key → Create in new project
3. Copy key starting with `AIza...`

**Code:**
```cpp
#define GEMINI_API_KEY "AIzaYOUR_KEY_HERE"

String callGeminiAPI(String prompt) {
    HTTPClient http;
    String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + String(GEMINI_API_KEY);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<1024> doc;
    JsonArray contents = doc.createNestedArray("contents");
    JsonObject content = contents.createNestedObject();
    JsonArray parts = content.createNestedArray("parts");
    JsonObject part = parts.createNestedObject();
    part["text"] = prompt;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    String response = http.getString();
    http.end();

    StaticJsonDocument<2048> responseDoc;
    deserializeJson(responseDoc, response);
    String aiResponse = responseDoc["candidates"][0]["content"]["parts"][0]["text"];

    return aiResponse;
}
```

### API Usage Limits & Costs

| Provider | Free Tier | Cost (1000 queries/day) | Speed |
|----------|-----------|-------------------------|-------|
| **Anthropic Claude Haiku** | $5 credit | ~$0.03/day | 100-200ms |
| **OpenAI GPT-4o-mini** | $5 credit | ~$0.05/day | 200-400ms |
| **Google Gemini Flash** | 15 req/min free | FREE | 300-500ms |

**Recommendation:** Start with Claude Haiku for production, use Gemini Flash for development/testing.

---

## 🛡️ SECURITY CONFIGURATION

### WiFi Security

**Enable WPA3 on Router:**
1. Log into router admin
2. Security Settings → WiFi Protected Access 3 (WPA3)
3. If devices won't connect, fall back to WPA2/WPA3 Mixed Mode

### API Key Protection

**NEVER hardcode API keys in .ino files!**

**✅ CORRECT:**
```cpp
// secrets.h (add to .gitignore)
#define WIFI_SSID "guy-fi"
#define WIFI_PASSWORD "244466666"
#define ANTHROPIC_API_KEY "sk-ant-..."

// main.ino
#include "secrets.h"
```

**❌ WRONG:**
```cpp
// main.ino
String apiKey = "sk-ant-..."; // EXPOSED IN GIT!
```

### Network Isolation (Advanced)

**Create VLAN for IoT Devices:**

1. Router settings → VLAN Configuration
2. Create VLAN ID 10 "IoT Devices"
3. Assign all ESP32 devices to VLAN 10
4. Firewall rules:
   - Block IoT VLAN → Main network (except Hub)
   - Allow IoT VLAN → Internet (for P4 AI calls only)
   - Allow Main network → IoT VLAN (for dashboard access)

---

## 🔧 TROUBLESHOOTING

### WiFi Connection Failures

**Symptom:** ESP32 stuck on "Connecting..."

**Solutions:**
1. **Check frequency band:** Ensure router broadcasts 2.4GHz
2. **Signal strength:** Move device closer to router (RSSI > -70 dBm)
3. **Password spaces:** Verify no trailing spaces in password
4. **DHCP pool:** Ensure router has available IP addresses
5. **MAC filtering:** Disable MAC address filtering temporarily

**Debug Code:**
```cpp
void setup() {
    Serial.begin(115200);
    WiFi.begin("guy-fi", "244466666");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        Serial.print(" RSSI: ");
        Serial.println(WiFi.RSSI());
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nConnection failed!");
        Serial.print("Status code: ");
        Serial.println(WiFi.status());
    }
}
```

### MQTT Connection Issues

**Symptom:** "MQTT connection failed, rc=-2"

**Error Codes:**
- `-2`: Network connection failed (check broker IP)
- `-4`: MQTT connection timeout (check port 1883)
- `-5`: Authentication failed (verify username/password)

**Solutions:**
1. Ping MQTT broker: `ping 192.168.86.38`
2. Check Mosquitto is running:
   ```bash
   # On Home Assistant:
   sudo systemctl status mosquitto
   ```
3. Test with MQTT client:
   ```bash
   mosquitto_pub -h 192.168.86.38 -p 1883 -u mqtt-ha -P dskjdfs98ewrkljh3 -t test -m "hello"
   ```

### AI API Errors

**Error 401: Unauthorized**
- API key is invalid or expired
- Regenerate key on provider website

**Error 429: Rate Limit Exceeded**
- Reduce query frequency
- Add cooldown: `delay(5000);` between API calls
- Upgrade to paid tier if needed

**JSON Parse Error:**
```cpp
// Add error handling
StaticJsonDocument<2048> doc;
DeserializationError error = deserializeJson(doc, response);
if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return "";
}
```

---

## 📋 COMPLETE secrets.h TEMPLATE

```cpp
// secrets.h - AI Coordinator System Configuration
// ⚠️ ADD THIS FILE TO .gitignore - DO NOT COMMIT!

#ifndef SECRETS_H
#define SECRETS_H

// ========== WiFi Configuration ==========
#define WIFI_SSID "guy-fi"
#define WIFI_PASSWORD "244466666"
#define WIFI_FALLBACK_SSID "FondleMyDongle"
#define WIFI_FALLBACK_PASSWORD "244466669"

// ========== Hub Network Configuration ==========
#define HUB_IP "192.168.1.100"              // ESP32-P4 Static IP
#define GATEWAY_IP "192.168.86.1"           // Router IP
#define SUBNET_MASK "255.255.255.0"
#define PRIMARY_DNS "8.8.8.8"               // Google DNS
#define SECONDARY_DNS "8.8.4.4"

// ========== MQTT Broker Configuration ==========
#define MQTT_SERVER "192.168.86.38"
#define MQTT_PORT 1883
#define MQTT_USER "mqtt-ha"
#define MQTT_PASSWORD "dskjdfs98ewrkljh3"

// ========== AI API Keys ==========
// Anthropic Claude (Recommended)
#define ANTHROPIC_API_KEY "sk-ant-YOUR_KEY_HERE"

// OpenAI GPT (Backup)
#define OPENAI_API_KEY "sk-YOUR_KEY_HERE"

// Google Gemini (Free Tier)
#define GEMINI_API_KEY "AIzaYOUR_KEY_HERE"

// ========== Active AI Provider ==========
#define AI_PROVIDER "anthropic"  // Options: "anthropic", "openai", "gemini"

// ========== WebSocket Configuration ==========
#define WS_PORT 80
#define WS_PATH "/ws"

// ========== Device Identification ==========
#define DEVICE_NAME "vanguard-hub"          // Unique device name
#define FIRMWARE_VERSION "1.0.0"

// ========== Security ==========
#define WEB_USERNAME "admin"
#define WEB_PASSWORD "vanguard2025"

#endif
```

---

## ✅ Configuration Checklist

Before deploying system:

- [ ] Router configured for 2.4GHz WiFi
- [ ] Static IP reservation set for ESP32-P4
- [ ] MQTT broker (Mosquitto) running on Home Assistant
- [ ] MQTT credentials verified (test with mosquitto_pub)
- [ ] AI API key obtained from Anthropic/OpenAI/Gemini
- [ ] secrets.h created with all credentials
- [ ] secrets.h added to .gitignore
- [ ] Test WiFi connection from each ESP32
- [ ] Test MQTT publish/subscribe from test device
- [ ] Test AI API call from P4 Hub
- [ ] Verify all 17 devices connect successfully
- [ ] Check dashboard accessible at http://192.168.1.100

---

**Network configured. AI integrated. Fleet ready for deployment.** 🚀
