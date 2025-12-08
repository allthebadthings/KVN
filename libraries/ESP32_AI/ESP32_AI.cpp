#include "ESP32_AI.h"
// #include <ArduinoJson.h> // Uncomment when ArduinoJson is installed

ESP32_AI::ESP32_AI(const char* apiKey, const char* provider) {
    _apiKey = apiKey;
    _provider = provider;
}

void ESP32_AI::begin() {
    _client.setInsecure(); // For testing, ignore SSL certificate
}

void ESP32_AI::setSystemPrompt(String prompt) {
    _systemPrompt = prompt;
}

String ESP32_AI::chat(String prompt) {
    if (String(_provider) == "anthropic") {
        return sendAnthropicRequest(prompt);
    } else if (String(_provider) == "openai") {
        return sendOpenAIRequest(prompt);
    }
    return "Error: Unknown provider";
}

String ESP32_AI::sendAnthropicRequest(String prompt) {
    // Placeholder for Anthropic API request
    // This would involve connecting to api.anthropic.com, sending JSON, and parsing response
    Serial.println("Sending request to Anthropic...");
    return "Hello from Claude (Simulation)";
}

String ESP32_AI::sendOpenAIRequest(String prompt) {
    // Placeholder for OpenAI API request
    Serial.println("Sending request to OpenAI...");
    return "Hello from GPT (Simulation)";
}
