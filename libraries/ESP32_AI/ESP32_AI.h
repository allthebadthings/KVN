#ifndef ESP32_AI_H
#define ESP32_AI_H

#include <Arduino.h>
#include <WiFiClientSecure.h>

class ESP32_AI {
public:
    ESP32_AI(const char* apiKey, const char* provider = "anthropic");
    
    // Initialize the client
    void begin();
    
    // Send a prompt to the AI and get a response
    String chat(String prompt);
    
    // Set the system prompt or context
    void setSystemPrompt(String prompt);

private:
    const char* _apiKey;
    const char* _provider;
    String _systemPrompt;
    WiFiClientSecure _client;
    
    String sendAnthropicRequest(String prompt);
    String sendOpenAIRequest(String prompt);
};

#endif
