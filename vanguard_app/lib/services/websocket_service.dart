import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  final String hubUrl = 'ws://192.168.1.100/ws';
  WebSocketChannel? _channel;
  final _sensor = StreamController<Map<String, dynamic>>.broadcast();
  final _status = StreamController<bool>.broadcast();
  Stream<Map<String, dynamic>> get sensorStream => _sensor.stream;
  Stream<bool> get statusStream => _status.stream;

  Future<void> connect() async {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(hubUrl));
      _status.add(true);
      _channel!.stream.listen((m) {
        final d = jsonDecode(m);
        if (d is Map<String, dynamic> && d['type'] == 'sensor_update') _sensor.add(d);
      }, onDone: () => _status.add(false), onError: (_) => _status.add(false));
    } catch (_) {
      _status.add(false);
    }
  }

  void send(String payload) {
    _channel?.sink.add(payload);
  }
}
