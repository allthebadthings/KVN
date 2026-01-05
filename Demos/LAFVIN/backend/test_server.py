import requests
import sys

# Create a dummy wav file (1 second of silence) if not exists
import wave
def create_dummy_wav(filename):
    with wave.open(filename, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        # Write 16000 frames of 0 (silence)
        w.writeframes(b'\x00\x00' * 16000)

def test_upload():
    url = "http://localhost:5000/upload"
    filename = "test_audio.raw"
    
    # Create dummy raw data (just zeros)
    data = b'\x00\x00' * 32000 # 1 second
    
    print(f"Sending {len(data)} bytes to {url}...")
    try:
        response = requests.post(url, data=data)
        print("Status Code:", response.status_code)
        print("Response:", response.json())
        
        if response.status_code == 200:
            print("TEST PASSED")
        else:
            print("TEST FAILED")
    except Exception as e:
        print(f"TEST FAILED: {e}")

if __name__ == "__main__":
    test_upload()
