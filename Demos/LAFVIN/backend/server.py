import os
import wave
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
import speech_recognition as sr
from gTTS import gTTS

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Audio Config (Must match ESP32)
SAMPLE_RATE = 16000
CHANNELS = 1
SAMPLE_WIDTH = 2 # 16-bit = 2 bytes

# Ollama Config
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "tinyllama"

def raw_to_wav(raw_data, wav_path):
    with wave.open(wav_path, 'wb') as wav_file:
        wav_file.setnchannels(CHANNELS)
        wav_file.setsampwidth(SAMPLE_WIDTH)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(raw_data)

def transcribe_audio(wav_path):
    r = sr.Recognizer()
    with sr.AudioFile(wav_path) as source:
        audio = r.record(source)
    try:
        # Using Google Web Speech API (free, online)
        # For offline, you can use: r.recognize_whisper(audio) (requires openai-whisper)
        text = r.recognize_google(audio)
        return text
    except sr.UnknownValueError:
        return None
    except sr.RequestError as e:
        print(f"STT Error: {e}")
        return None

def query_llm(prompt):
    try:
        payload = {
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        }
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json().get('response', "Error from LLM")
    except Exception as e:
        print(f"LLM Error: {e}")
        return f"Error connecting to Ollama: {e}. Is it running?"

def text_to_speech(text, output_path):
    try:
        tts = gTTS(text=text, lang='en')
        tts.save(output_path)
        return True
    except Exception as e:
        print(f"TTS Error: {e}")
        return False

@app.route('/upload', methods=['POST'])
def handle_audio():
    print("Received audio stream...")
    raw_data = request.data
    
    # 1. Save Raw Audio
    raw_path = os.path.join(UPLOAD_FOLDER, 'input.raw')
    wav_path = os.path.join(UPLOAD_FOLDER, 'input.wav')
    
    with open(raw_path, 'wb') as f:
        f.write(raw_data)
        
    # 2. Convert to WAV
    raw_to_wav(raw_data, wav_path)
    
    # 3. Transcribe (STT)
    text_input = transcribe_audio(wav_path)
    print(f"User said: {text_input}")
    
    if not text_input:
        return jsonify({"text": "Sorry, I didn't catch that.", "audio_url": None})
    
    # 4. LLM Response
    llm_response = query_llm(text_input)
    print(f"LLM said: {llm_response}")
    
    # 5. TTS
    output_filename = "response.mp3"
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)
    text_to_speech(llm_response, output_path)
    
    # 6. Construct URL
    # Assuming the ESP32 can reach this IP
    host_ip = request.host.split(':')[0] # Get current IP
    port = request.host.split(':')[1] if ':' in request.host else 5000
    audio_url = f"http://{host_ip}:{port}/audio/{output_filename}"
    
    return jsonify({
        "text": llm_response,
        "audio_url": audio_url
    })

@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)

@app.route('/chat', methods=['GET'])
def check_status():
    return "Server is running. POST raw audio to /upload."

if __name__ == '__main__':
    # Run on all interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)
