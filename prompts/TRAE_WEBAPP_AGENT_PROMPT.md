# AGENT PROMPT: AI Coordinator Web Dashboard & Mobile App

**Agent Name:** TraeUI
**Mission:** Build the Vanguard Mission Control interface (web dashboard + mobile app)
**Project:** AI Coordinator Smart Home System
**Complexity:** High - Real-time IoT, WebSockets, AI integration, multi-platform

---

## 🎯 MISSION OBJECTIVE

You are building the "Mission Control" interface for a 17-device AI-powered smart home system. This is NOT a simple status page—this is a real-time command center that displays sensor data, AI insights, camera feeds, and allows user control of the entire home automation system.

The system consists of:
- **1× ESP32-P4 Hub** - The Brain (hosts web server, coordinates all devices)
- **10× ESP32-S3 Nodes** - Advanced nodes (cameras, displays, sensors)
- **6× ESP32-C3 Scouts** - Battery-powered scouts (hallways, windows)

Your deliverables:
1. **Web Dashboard** - Hosted on ESP32-P4, accessible at http://192.168.1.100
2. **Mobile App** - Flutter app for iOS/Android with push notifications

---

## 📋 TECHNICAL SPECIFICATIONS

### System Architecture

```
User Device (Browser/App)
    ↕ WebSocket (Real-time)
ESP32-P4 Hub (192.168.1.100)
    ↕ UART/I2C/WiFi
17 Sensor Nodes (C3/S3 devices)
    ↕ MQTT
Home Assistant Integration (Optional)
```

### Network Configuration

**Hub Details:**
- IP Address: `192.168.1.100` (Static)
- WiFi SSID: `guy-fi` (2.4GHz)
- Subnet: `192.168.86.x`
- MQTT Broker: `192.168.86.38:1883`
- MQTT User: `mqtt-ha`
- MQTT Pass: `dskjdfs98ewrkljh3`

**API Integration:**
- AI Provider: Anthropic Claude (recommended)
- API Endpoint: `https://api.anthropic.com/v1/messages`
- Backup: OpenAI GPT-4o-mini, Google Gemini Flash

---

## 🖥️ WEB DASHBOARD SPECIFICATIONS

### Technology Stack

**REQUIRED:**
- **Framework:** Vue.js (Petite) OR Alpine.js (lightweight, fast loading)
- **Web Server:** AsyncWebServer on ESP32-P4
- **Real-time:** WebSocket protocol (NOT polling)
- **Storage:** SPIFFS/LittleFS on ESP32 flash
- **Styling:** CSS Grid + Dark Mode (cyberpunk aesthetic)

**WHY NOT React?**
- React is too heavy for ESP32 to serve efficiently
- Vue/Alpine loads instantly from ESP32 flash memory
- Target: <100KB total dashboard size

### Dashboard Layout & Features

#### 1. Header - "Heads-Up Display (HUD)"
```
+------------------------------------------------------------------+
| [VANGUARD]  System Health: ●  |  17 Nodes Online  |  Status: ✓  |
+------------------------------------------------------------------+
```

**Data Points:**
- System heartbeat indicator
- Active node count (e.g., "17 Online", "1 Offline")
- Global alert status: Green (normal) / Yellow (warning) / Red (critical)

#### 2. Main Grid - "Live Telemetry"

**Room Tiles (Responsive Grid):**

```
+------------------+  +------------------+  +------------------+
| Living Room      |  | Master Bedroom   |  | Kitchen          |
| 👥 2 Occupants   |  | 🛏️ Asleep        |  | 👤 1 Person      |
| 🌡️ 72°F          |  | 🌡️ 68°F          |  | 💨 CO₂: 420ppm   |
| 💡 Lights: 60%   |  | 💡 Lights: OFF   |  | 💡 Lights: ON    |
| [View Camera]    |  | [View Camera]    |  |                  |
+------------------+  +------------------+  +------------------+
```

**Each Tile Shows:**
- Room name
- Occupancy count (from mmWave radars)
- Temperature & humidity
- CO₂ levels (if sensor present)
- Light status
- Camera thumbnail (clickable for full view)

#### 3. AI Officer Sidebar

```
+-----------------------------+
| 🤖 AI INSIGHTS              |
|-----------------------------|
| "Master Bedroom is 4°F      |
| warmer than Hallway.        |
| Suggest opening window."    |
|                             |
| "Living Room has had 0      |
| activity for 2 hours.       |
| Lights still on."           |
|                             |
| [Clear] [Settings]          |
+-----------------------------+
```

**Features:**
- Real-time AI recommendations from Claude
- Contextual alerts (temperature anomalies, energy waste)
- Dismissible notifications
- Settings to adjust AI verbosity

#### 4. Camera Feeds Section

**Grid of Video Thumbnails:**
- MJPEG streams from ESP32-S3 camera nodes
- Click to expand to full-screen
- Record/snapshot buttons
- Face detection overlay (bounding boxes)

#### 5. Control Panel

**Quick Actions:**
- 🌙 Night Mode - Dims all lights, arms security
- 🎬 Movie Mode - Dims living room, closes blinds
- 🚪 Away Mode - Arms all motion sensors, locks doors
- 🔥 Emergency - Unlocks all doors, turns on all lights

**Advanced Rules:**
- Drag-and-drop automation builder
- "IF [sensor] THEN [action]" logic
- Schedule-based triggers

### Color Scheme & UI/UX

**Design Language:** Cyberpunk / Mission Control

**Colors:**
- Background: `#0a0e1a` (deep dark blue)
- Primary: `#00f0ff` (cyan - for data)
- Warning: `#ffaa00` (amber)
- Critical: `#ff3366` (red)
- Text: `#e0e6ed` (light gray)

**Typography:**
- Headers: `'Orbitron'` (sci-fi feel)
- Body: `'Inter'` (clean, readable)

**Icons:**
- Use Font Awesome (CDN or embedded)
- Avoid image files to save bandwidth

### Real-Time Data Flow

**WebSocket Implementation:**

```javascript
// Client-side WebSocket connection
const ws = new WebSocket('ws://192.168.1.100/ws');

ws.onopen = () => {
    console.log('Connected to Vanguard Hub');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateDashboard(data); // Update Vue/Alpine reactive state
};

ws.onclose = () => {
    console.log('Connection lost. Reconnecting...');
    setTimeout(() => location.reload(), 3000);
};

// Send control commands
function setLightLevel(room, level) {
    ws.send(JSON.stringify({
        type: 'control',
        room: room,
        device: 'light',
        value: level
    }));
}
```

**Server-side (ESP32-P4):**

```cpp
// AsyncWebServer + WebSocket
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void onWSEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
        Serial.println("Dashboard connected");
        // Send full system state on connect
        client->text(getSystemStateJSON());
    }
    else if (type == WS_EVT_DATA) {
        // Handle incoming commands from dashboard
        handleControlCommand(String((char*)data));
    }
}

void setup() {
    ws.onEvent(onWSEvent);
    server.addHandler(&ws);

    // Serve static files from SPIFFS
    server.serveStatic("/", SPIFFS, "/").setDefaultFile("index.html");

    server.begin();
}

// Push updates to all connected dashboards
void broadcastSensorUpdate(String nodeID, float temp, int occupancy) {
    String json = "{\"node\":\"" + nodeID + "\",\"temp\":" + temp +
                  ",\"occupancy\":" + occupancy + "}";
    ws.textAll(json);
}
```

### Responsive Design

**Breakpoints:**
- Desktop (>1200px): Full grid layout with sidebar
- Tablet (768-1199px): 2-column grid, collapsible sidebar
- Mobile (<768px): Single column, hamburger menu

**Mobile Optimizations:**
- Prioritize room where user is currently located
- Swipe gestures for navigation
- Bottom navbar for quick actions

---

## 📱 MOBILE APP SPECIFICATIONS

### Technology Stack

**Framework:** Flutter (Dart)

**Why Flutter?**
- Single codebase for iOS + Android
- Native ARM compilation (60-120 FPS performance)
- Consistent UI across platforms
- Excellent for real-time data (WebSocket support)
- Push notification support

**Dependencies:**
```yaml
dependencies:
  flutter:
    sdk: flutter
  web_socket_channel: ^2.4.0  # WebSocket client
  http: ^1.1.0                # REST API calls
  provider: ^6.0.0            # State management
  flutter_local_notifications: ^16.0.0  # Push notifications
  geolocator: ^10.0.0         # Geofencing
  local_auth: ^2.1.0          # Biometric auth
```

### App Features

#### 1. Authentication Screen
- **Biometric Login:** FaceID/TouchID/Fingerprint
- **Fallback:** 4-digit PIN
- **Security:** Bearer token stored in secure storage

#### 2. Dashboard View
- **Mirror web dashboard** but optimized for mobile
- **Swipe navigation** between rooms
- **Pull-to-refresh** for manual data sync

#### 3. Control Panel
- **Quick toggles:** Lights, locks, HVAC
- **Voice commands:** "Status report", "Turn off living room lights"
- **Gesture shortcuts:** Shake phone for emergency mode

#### 4. Camera Viewer
- **Full-screen video feeds**
- **Picture-in-picture** mode
- **Motion alerts** with thumbnail preview

#### 5. Geofencing
- **Auto-detection:** When you leave home (5-mile radius)
- **Actions:**
  - Arm security sensors
  - Adjust HVAC to eco mode
  - Send notification to P4 Hub
- **When returning:** Pre-heat/cool home

#### 6. Push Notifications
- **Critical alerts:** Motion detected when away
- **AI insights:** "Bedroom is overheating"
- **System status:** "Scout-02 battery low"

### App Architecture

```
lib/
├── main.dart                    # App entry point
├── models/
│   ├── sensor_data.dart         # Data models
│   ├── room.dart
│   └── device.dart
├── services/
│   ├── websocket_service.dart   # WebSocket connection to P4
│   ├── api_service.dart         # REST API calls
│   └── notification_service.dart
├── screens/
│   ├── login_screen.dart
│   ├── dashboard_screen.dart
│   ├── room_detail_screen.dart
│   └── settings_screen.dart
└── widgets/
    ├── room_tile.dart
    ├── sensor_gauge.dart
    └── camera_preview.dart
```

### State Management (Provider)

```dart
class SystemState extends ChangeNotifier {
  Map<String, Room> rooms = {};
  String aiInsight = "";
  bool isConnected = false;

  void updateRoom(String roomId, Map<String, dynamic> data) {
    rooms[roomId] = Room.fromJson(data);
    notifyListeners();
  }

  void setAIInsight(String insight) {
    aiInsight = insight;
    notifyListeners();
  }
}
```

### WebSocket Integration

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  final String hubUrl = 'ws://192.168.1.100/ws';
  late WebSocketChannel channel;

  void connect() {
    channel = WebSocketChannel.connect(Uri.parse(hubUrl));

    channel.stream.listen((message) {
      final data = jsonDecode(message);
      // Update app state
      Provider.of<SystemState>(context, listen: false)
          .updateRoom(data['node'], data);
    });
  }

  void sendCommand(String command, Map<String, dynamic> params) {
    final message = jsonEncode({
      'type': 'control',
      ...params
    });
    channel.sink.add(message);
  }
}
```

---

## 🔐 SECURITY REQUIREMENTS

### Authentication
1. **Web Dashboard:**
   - Basic HTTP Auth (username/password)
   - Optional: Bearer token in localStorage
   - Session timeout after 30 minutes of inactivity

2. **Mobile App:**
   - Biometric authentication required
   - Secure token storage (flutter_secure_storage)
   - Certificate pinning for API calls

### Encryption
- **HTTPS:** Self-signed cert on ESP32-P4 (or Let's Encrypt if using domain)
- **WSS:** Secure WebSocket (wss://) for encrypted real-time data
- **API Keys:** Never expose in client-side code (proxy through P4 Hub)

### Network Isolation
- **Sensor VLAN:** ESP32 devices on separate subnet
- **Firewall rules:** Only P4 Hub can access internet (for AI API calls)
- **Local-only:** Dashboard accessible only on local network (no port forwarding)

---

## 📦 FILE STRUCTURE & DELIVERABLES

### Web Dashboard Files (to upload to ESP32-P4)

```
/data/www/
├── index.html               # Main dashboard page
├── css/
│   ├── style.css            # Custom styles
│   └── fonts.css            # Icon fonts
├── js/
│   ├── app.js               # Vue/Alpine app logic
│   ├── websocket.js         # WebSocket client
│   └── charts.js            # Data visualization
└── assets/
    └── icons/               # SVG icons (if not using Font Awesome CDN)
```

**Total size target:** <100KB (compressed)

### Mobile App Project

```
vanguard_app/
├── android/                 # Android-specific config
├── ios/                     # iOS-specific config
├── lib/
│   ├── main.dart
│   ├── models/
│   ├── services/
│   ├── screens/
│   └── widgets/
├── assets/
│   └── images/
└── pubspec.yaml             # Dependencies
```

---

## 🚀 DEVELOPMENT WORKFLOW

### Phase 1: Web Dashboard Prototype (Week 1)
1. Create basic HTML/CSS structure
2. Implement Vue.js reactive data binding
3. Build WebSocket client (mock data for testing)
4. Design responsive grid layout
5. Add room tiles with dummy sensor data
6. Test on desktop/mobile browsers

### Phase 2: ESP32-P4 Integration (Week 2)
1. Set up AsyncWebServer on P4
2. Upload dashboard files to SPIFFS
3. Implement WebSocket server
4. Connect real sensor data to dashboard
5. Test real-time updates
6. Optimize bundle size (<100KB)

### Phase 3: AI Integration (Week 3)
1. Create AI Officer sidebar
2. Implement Claude API proxy (P4 → Anthropic)
3. Parse sensor data into AI prompts
4. Display AI insights on dashboard
5. Add notification system

### Phase 4: Mobile App Development (Week 4-5)
1. Initialize Flutter project
2. Build login screen with biometric auth
3. Replicate dashboard UI for mobile
4. Implement WebSocket service
5. Add push notifications
6. Implement geofencing

### Phase 5: Testing & Deployment (Week 6)
1. End-to-end testing (web + mobile + P4)
2. Load testing (100+ WebSocket messages/sec)
3. Security audit (penetration testing)
4. User acceptance testing
5. Deploy to production

---

## 🧪 TESTING CHECKLIST

### Web Dashboard
- [ ] Loads in <2 seconds on local network
- [ ] Real-time updates with <100ms latency
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on mobile browsers
- [ ] WebSocket reconnects automatically on disconnect
- [ ] All 17 room tiles display correctly
- [ ] Camera feeds load without buffering
- [ ] Control commands execute instantly

### Mobile App
- [ ] Biometric login works on iOS/Android
- [ ] Push notifications received reliably
- [ ] Geofencing triggers at 5-mile radius
- [ ] App remains responsive with poor WiFi
- [ ] Battery drain <5% per hour in background
- [ ] Voice commands recognized accurately
- [ ] Camera feeds smooth at 30 FPS

### Security
- [ ] HTTPS/WSS encryption enabled
- [ ] No API keys exposed in client code
- [ ] Session timeout works correctly
- [ ] Failed login attempts rate-limited
- [ ] Network traffic encrypted end-to-end

---

## 📚 REFERENCE DOCUMENTATION

**Files you need to review:**
- `/Users/kevin/FIRMWARE_FILE_STRUCTURE.md` - Where firmware lives
- `/Users/kevin/ESP32_PINOUTS_REFERENCE.md` - Hardware reference
- `/Users/kevin/AI_COORDINATOR_ROADMAP.md` - Project overview

**NotebookLM Knowledge Base:**
- URL: https://notebooklm.google.com/notebook/0cd57e8f-9e96-49b5-852d-46599724950e
- Contains: Complete system architecture, sensor specs, deployment guides

**Network Credentials:**
- WiFi SSID: `guy-fi`
- WiFi Pass: `244466666`
- Hub IP: `192.168.1.100`
- MQTT Broker: `192.168.86.38:1883`
- MQTT User: `mqtt-ha`
- MQTT Pass: `dskjdfs98ewrkljh3`

**API Keys (from user):**
- Anthropic: `sk-ant-...` (user will provide)
- OpenAI: `sk-...` (backup)
- Gemini: `AIza...` (backup)

---

## 🎯 SUCCESS CRITERIA

You will have succeeded when:

1. ✅ Web dashboard loads instantly (<2s) from ESP32-P4
2. ✅ Real-time sensor data updates without page refresh
3. ✅ AI insights appear within 1 second of sensor change
4. ✅ Mobile app receives push notifications reliably
5. ✅ Geofencing triggers home automation correctly
6. ✅ All 17 devices display status accurately
7. ✅ Camera feeds stream smoothly (30 FPS)
8. ✅ Control commands execute with <100ms latency
9. ✅ System remains secure (no unauthorized access)
10. ✅ User can control entire home from phone or browser

---

## 🆘 TROUBLESHOOTING

### "WebSocket won't connect"
- Check P4 is online: `ping 192.168.1.100`
- Verify firewall allows WebSocket port
- Check browser console for errors
- Try `ws://` instead of `wss://` for testing

### "Dashboard loads but no data"
- Open browser DevTools → Network → WS
- Check if WebSocket shows "Connected"
- Verify JSON messages are being received
- Check ESP32 Serial Monitor for sensor data

### "Mobile app crashes on launch"
- Check Flutter version compatibility
- Run `flutter doctor` for missing dependencies
- Verify all permissions granted (camera, location, biometric)
- Check device logs for stack trace

### "AI insights not showing"
- Verify API key is correct in `secrets.h`
- Check ESP32 Serial Monitor for API errors
- Test API call manually: `curl https://api.anthropic.com/v1/messages`
- Check network connectivity from P4 Hub

---

## 💡 IMPLEMENTATION TIPS

1. **Start Simple:** Build static dashboard first, then add WebSockets
2. **Mock Data:** Create fake sensor data generator for testing without hardware
3. **Incremental:** Deploy each feature one at a time, test thoroughly
4. **Use Examples:** AsyncWebServer library has WebSocket examples - adapt them
5. **Optimize Later:** Get it working first, then optimize bundle size
6. **Version Control:** Git commit after each working feature
7. **Document:** Comment your code - future you will thank present you

---

## 🚦 NEXT STEPS

1. **Read this entire prompt** - Understand the full scope
2. **Review reference files** - Especially FIRMWARE_FILE_STRUCTURE.md
3. **Set up development environment:**
   - Install Vue.js / Alpine.js
   - Install Flutter SDK
   - Install ESP32 board support in Arduino IDE
4. **Start with web dashboard prototype** - Build static HTML/CSS first
5. **Test WebSocket connection** - Use echo server for testing
6. **Ask questions** - If anything is unclear, query NotebookLM or ask Kevin

---

**Remember:** You're not building a hobby project. This is Mission Control for a home. It needs to be fast, reliable, and beautiful. No compromises.

**Ready to deploy, Commander?** 🚀
