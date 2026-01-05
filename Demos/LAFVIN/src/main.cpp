#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Audio.h> // ESP32-audioI2S library
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include <driver/i2s.h>

// --- Globals ---
Audio audio;
bool isRecording = false;
const i2s_port_t I2S_PORT = I2S_NUM_0;

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void showStatus(const char* msg) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(msg);
    display.display();
    Serial.println(msg);
}

// Buffer for audio recording
// 5 seconds * 16000 samples/sec * 2 bytes/sample = 160,000 bytes.
// We'll allocate this in PSRAM if available, or just use chunks.
// For this example, we will stream chunks to the server to save RAM.

void setupWifi() {
    showStatus("Connecting WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    Serial.println(WiFi.localIP());
    showStatus("WiFi Connected");
}

void setupI2S_Mic() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };
    
    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_MIC_SCK,
        .ws_io_num = I2S_MIC_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = I2S_MIC_SD
    };

    i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_PORT, &pin_config);
}

// We need to switch I2S modes because some libraries claim the driver exclusively.
// Audio library handles Output, we handle Input manually or share?
// For simplicity, we will deinit Audio lib when recording, and re-init when playing.

void sendAudioToServer(uint8_t *data, size_t len) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    String serverPath = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/chat";
    
    http.begin(serverPath);
    http.addHeader("Content-Type", "audio/wav"); // Or application/octet-stream
    
    // In a real streaming implementation, we'd use chunked encoding.
    // Here we'll just simulate sending a buffer for the demo logic.
    // NOTE: This function placeholder implies we have the full buffer.
}

void setup() {
    Serial.begin(115200);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    
    // Setup Display
    Wire.begin(I2C_SDA, I2C_SCL);
    if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
        Serial.println(F("SSD1306 allocation failed"));
    }
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.clearDisplay();
    display.display();

    setupWifi();
    
    // Setup Speaker (Output) using Audio Library
    audio.setPinout(I2S_SPK_BCLK, I2S_SPK_LRC, I2S_SPK_DIN);
    audio.setVolume(15); // 0...21
    
    showStatus("Ready. Hold Button");
}

void loop() {
    audio.loop();

    // Simple Push-to-Talk Logic
    if (digitalRead(BUTTON_PIN) == LOW) {
        if (!isRecording) {
            showStatus("Recording...");
            isRecording = true;
            
            // Stop playback to free I2S or avoid conflict (if sharing bus)
            // audio.stopSong(); 
            
            // Initialize Mic I2S
            setupI2S_Mic();
            
            // Open Connection to Server
            WiFiClient client;
            if (client.connect(SERVER_IP, SERVER_PORT)) {
                Serial.println("Connected to server");
                client.println("POST /upload HTTP/1.1");
                client.println("Host: " + String(SERVER_IP));
                client.println("Content-Type: application/octet-stream");
                client.println("Transfer-Encoding: chunked");
                client.println("Connection: keep-alive");
                client.println();

                // Read from Mic and Stream to Server
                size_t bytes_read = 0;
                char *i2s_buffer = (char *)calloc(1024, sizeof(char));
                
                while (digitalRead(BUTTON_PIN) == LOW) {
                    i2s_read(I2S_PORT, i2s_buffer, 1024, &bytes_read, portMAX_DELAY);
                    if (bytes_read > 0) {
                        client.print(String(bytes_read, HEX));
                        client.println();
                        client.write((const uint8_t*)i2s_buffer, bytes_read);
                        client.println();
                    }
                    delay(1); // Watchdog
                }
                
                // End Chunk
                client.println("0");
                client.println();
                
                showStatus("Thinking...");

                // Read Response (Simple JSON with "audio_url" and "text")
                String response = "";
                bool headerEnded = false;
                while (client.connected()) {
                    String line = client.readStringUntil('\n');
                    if (line == "\r") headerEnded = true;
                    if (headerEnded && line.length() > 0 && line != "\r") {
                        response += line;
                    }
                    if (!client.available() && headerEnded) break;
                }
                client.stop();
                
                Serial.println("Response: " + response);
                
                // Parse JSON
                // Expected: {"text": "Hello...", "audio_url": "http://..."}
                DynamicJsonDocument doc(1024);
                deserializeJson(doc, response);
                const char* audio_url = doc["audio_url"];
                const char* text_response = doc["text"];
                
                if (text_response) {
                    showStatus(text_response);
                } else {
                    showStatus("Error/No Text");
                }
                
                // Cleanup Mic
                i2s_driver_uninstall(I2S_PORT);
                
                // Play Audio
                if (audio_url) {
                    audio.connecttohost(audio_url);
                }
                
                free(i2s_buffer);
            } else {
                showStatus("Conn Failed");
                delay(1000);
            }
            
            isRecording = false;
            // showStatus("Ready"); // Don't clear immediately so user can read text
        }
    }
}

// Audio library status callbacks
void audio_info(const char *info){
    Serial.print("info        "); Serial.println(info);
}
void audio_eof_mp3(const char *info){  //end of file
    Serial.print("eof_mp3     "); Serial.println(info);
}
