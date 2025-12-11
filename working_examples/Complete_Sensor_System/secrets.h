// secrets.h - WiFi and AI API Configuration
// ⚠️ DO NOT commit this to git! Add to .gitignore

#ifndef SECRETS_H
#define SECRETS_H

// WiFi Configuration
#define WIFI_SSID "guy-fi"              // Primary network
#define WIFI_PASSWORD "your-password"    // Network password
#define WIFI_FALLBACK_SSID "backup-network"  // Optional backup

// Hub IP Configuration
#define HUB_IP "192.168.1.100"          // Static IP for P4 Hub

// AI API Keys
#define ANTHROPIC_API_KEY "sk-ant-..."  // Claude (Recommended)
#define OPENAI_API_KEY "sk-..."         // GPT (Optional)
#define GEMINI_API_KEY "AIza..."        // Gemini (Optional)

// MQTT Broker (if using)
#define MQTT_SERVER "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_USER "vanguard"
#define MQTT_PASSWORD "secure-password"

#endif