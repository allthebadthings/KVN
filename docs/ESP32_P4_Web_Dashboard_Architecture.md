## 1. Architecture Design

```mermaid
graph TD
  A[User Browser] --> B[Vue.js/Alpine.js Dashboard]
  B --> C[WebSocket Client]
  C --> D[ESP32-P4 AsyncWebServer]
  D --> E[17 Sensor Nodes]
  D --> F[Claude AI API]
  
  subgraph "Frontend Layer"
    B
    C
  end
  
  subgraph "ESP32-P4 Hub Layer"
    D
  end
  
  subgraph "IoT Device Layer"
    E
  end
  
  subgraph "AI Service Layer"
    F
  end
```

## 2. Technology Description
- **Frontend**: Vue.js Petite OR Alpine.js (lightweight <100KB)
- **Web Server**: AsyncWebServer on ESP32-P4
- **Real-time**: WebSocket protocol (NOT polling)
- **Storage**: SPIFFS/LittleFS on ESP32 flash
- **Styling**: CSS Grid + Dark Mode cyberpunk aesthetic
- **Backend**: ESP32-P4 C++ (AsyncWebServer + WebSocket handling)
- **Database**: None (real-time sensor data only)

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | Dashboard homepage with HUD and live telemetry |
| /cameras | Camera feeds grid with MJPEG streams |
| /control | Control panel with quick actions and automation |
| /ws | WebSocket endpoint for real-time data |

## 4. API Definitions

### 4.1 WebSocket API
**Connection:** `ws://192.168.1.100/ws`

**Incoming Messages (Server → Client):**
```json
{
  "type": "sensor_update",
  "node": "living_room",
  "temp": 72.5,
  "humidity": 45,
  "occupancy": 2,
  "co2": 420,
  "light_level": 60
}
```

**Outgoing Messages (Client → Server):**
```json
{
  "type": "control",
  "room": "living_room",
  "device": "light",
  "value": 80
}
```

### 4.2 HTTP API
**System State:** `GET /api/state`
**Response:**
```json
{
  "nodes_online": 17,
  "system_health": "healthy",
  "ai_insights": ["Bedroom is 4°F warmer than hallway"]
}
```

## 5. Server Architecture Diagram

```mermaid
graph TD
  A[Client Browser] --> B[AsyncWebServer]
  B --> C[WebSocket Handler]
  B --> D[Static File Server]
  C --> E[Sensor Data Processor]
  C --> F[Device Controller]
  E --> G[MQTT Client]
  F --> H[UART/I2C/WiFi]
  
  subgraph "ESP32-P4 Hub"
    B
    C
    D
    E
    F
  end
  
  subgraph "Device Communication"
    G
    H
  end
```

## 6. Data Model

### 6.1 Sensor Data Structure
```mermaid
erDiagram
  SENSOR_NODE {
    string node_id PK
    string room_name
    string node_type
    float temperature
    float humidity
    int occupancy
    int co2_level
    int light_level
    boolean is_online
    timestamp last_update
  }
  
  CAMERA_NODE {
    string node_id PK
    string room_name
    string stream_url
    boolean is_recording
    boolean motion_detected
    timestamp last_motion
  }
  
  CONTROL_COMMAND {
    string command_id PK
    string node_id FK
    string device_type
    string action
    int value
    timestamp timestamp
    string status
  }
```

### 6.2 ESP32-P4 Data Structures
**Sensor Node Data:**
```cpp
struct SensorData {
  String nodeId;
  String roomName;
  float temperature;
  float humidity;
  int occupancy;
  int co2Level;
  int lightLevel;
  bool isOnline;
  unsigned long lastUpdate;
};
```

**WebSocket Message Handler:**
```cpp
void handleWebSocketMessage(String message) {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, message);
  
  String type = doc["type"];
  if (type == "control") {
    String room = doc["room"];
    String device = doc["device"];
    int value = doc["value"];
    executeControlCommand(room, device, value);
  }
}
```