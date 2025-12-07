import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/system_provider.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const VanguardApp());
}

class VanguardApp extends StatelessWidget {
  const VanguardApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => SystemState())],
      child: MaterialApp(
        title: 'Vanguard Mission Control',
        theme: ThemeData.dark(),
        home: const DashboardScreen(),
      ),
    );
  }
}
