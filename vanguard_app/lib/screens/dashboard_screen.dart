import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/system_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vanguard Mission Control')),
      body: Consumer<SystemState>(builder: (context, s, _) {
        final items = s.rooms.values.toList();
        return GridView.builder(
          padding: const EdgeInsets.all(12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.2, crossAxisSpacing: 12, mainAxisSpacing: 12),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final r = items[i];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text(r.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Row(children: [const Icon(Icons.person), Text('${r.occupancy}')]),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [const Icon(Icons.thermostat), Text('${r.temperature.toStringAsFixed(1)}°F')]),
                  Row(children: [const Icon(Icons.water_drop), Text('${r.humidity}%')]),
                  Row(children: [const Icon(Icons.cloud), Text('${r.co2} ppm')]),
                  Row(children: [const Icon(Icons.lightbulb), Text('${r.lightLevel}%')]),
                  const Spacer(),
                  Row(children: [
                    ElevatedButton(onPressed: () => s.sendLight(r.id, r.lightLevel > 0 ? 0 : 75), child: const Icon(Icons.power_settings_new)),
                    const SizedBox(width: 12),
                    ElevatedButton(onPressed: () => s.activateMode('night'), child: const Text('Night')),
                  ])
                ]),
              ),
            );
          },
        );
      }),
    );
  }
}
