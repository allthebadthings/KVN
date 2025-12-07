import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../services/websocket_service.dart';

class Room {
  final String id;
  String name;
  int occupancy;
  double temperature;
  int humidity;
  int co2;
  int lightLevel;
  bool isOnline;
  Room({required this.id, required this.name, this.occupancy = 0, this.temperature = 70, this.humidity = 40, this.co2 = 400, this.lightLevel = 0, this.isOnline = true});
  factory Room.fromJson(Map<String, dynamic> j) => Room(id: j['node'] ?? j['id'], name: j['room_name'] ?? j['id'], occupancy: j['occupancy'] ?? 0, temperature: (j['temp'] ?? 70).toDouble(), humidity: j['humidity'] ?? 40, co2: j['co2'] ?? 400, lightLevel: j['light_level'] ?? 0, isOnline: j['is_online'] ?? true);
}

class SystemState extends ChangeNotifier {
  final Map<String, Room> rooms = {};
  String aiInsight = '';
  bool isConnected = false;
  late final WebSocketService _ws;

  SystemState() {
    _ws = WebSocketService();
    _ws.sensorStream.listen((u) => _handleSensorUpdate(u));
    _ws.statusStream.listen((s) => _handleStatus(s));
    _ws.connect();
    _seedDemo();
  }

  void _seedDemo() {
    if (rooms.isNotEmpty) return;
    for (var i = 0; i < 6; i++) {
      final id = ['living_room', 'master_bedroom', 'kitchen', 'office', 'hallway', 'bathroom'][i];
      rooms[id] = Room(id: id, name: id.replaceAll('_', ' '), occupancy: i % 3, temperature: 68 + i.toDouble(), humidity: 35 + i * 2, co2: 360 + i * 20, lightLevel: (i * 15) % 100, isOnline: true);
    }
    notifyListeners();
  }

  void _handleSensorUpdate(Map<String, dynamic> data) {
    final id = data['node'];
    final r = rooms[id] ?? Room.fromJson(data);
    r.temperature = (data['temp'] ?? r.temperature).toDouble();
    r.humidity = data['humidity'] ?? r.humidity;
    r.occupancy = data['occupancy'] ?? r.occupancy;
    r.co2 = data['co2'] ?? r.co2;
    r.lightLevel = data['light_level'] ?? r.lightLevel;
    rooms[id] = r;
    notifyListeners();
  }

  void _handleStatus(bool connected) {
    isConnected = connected;
    notifyListeners();
  }

  void sendLight(String roomId, int value) {
    _ws.send(jsonEncode({'type': 'control', 'room': roomId, 'device': 'light', 'value': value}));
  }

  void activateMode(String mode) {
    _ws.send(jsonEncode({'type': 'mode', 'mode': mode}));
  }
}
