import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/system_provider.dart';
import '../theme/colors.dart';
import '../theme/component_themes.dart';
import '../theme/spacing.dart';
import '../theme/typography.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vanguard Mission Control'),
        actions: [
          Consumer<SystemState>(
            builder: (context, s, _) => Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: VanguardSpacing.sm),
              child: Row(children: [
                Icon(
                  s.isConnected ? Icons.cloud_done : Icons.cloud_off,
                  color: s.isConnected ? VanguardColors.success : Colors.grey,
                ),
                const SizedBox(width: VanguardSpacing.xs),
                Text(
                  s.isConnected ? 'Online' : 'Offline',
                  style: RoomCardTheme.sensorValueStyle,
                ),
              ]),
            ),
          ),
        ],
      ),
      body: Consumer<SystemState>(builder: (context, s, _) {
        final items = s.rooms.values.toList();
        if (items.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.meeting_room, size: 48, color: Colors.white30),
                const SizedBox(height: VanguardSpacing.sm),
                Text('No rooms available yet',
                    style: VanguardTypography.sensorLabel),
              ],
            ),
          );
        }
        return GridView.builder(
          padding: const EdgeInsets.all(VanguardSpacing.md),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.2,
            crossAxisSpacing: VanguardSpacing.md,
            mainAxisSpacing: VanguardSpacing.md,
          ),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final r = items[i];
            return Card(
              child: Container(
                decoration: RoomCardTheme.cardDecoration,
                padding: RoomCardTheme.cardPadding,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(r.name, style: RoomCardTheme.roomNameStyle),
                        Row(children: [
                          Icon(
                            SensorIconTheme.occupancy,
                            color: SensorIconTheme.getIconColor('occupancy'),
                          ),
                          Text('${r.occupancy}',
                              style: RoomCardTheme.sensorValueStyle),
                        ]),
                      ],
                    ),
                    const SizedBox(height: VanguardSpacing.sm),
                    _buildSensorRow(
                      SensorIconTheme.temperature,
                      SensorIconTheme.getIconColor('temperature'),
                      '${r.temperature.toStringAsFixed(1)}°F',
                    ),
                    _buildSensorRow(
                      SensorIconTheme.humidity,
                      SensorIconTheme.getIconColor('humidity'),
                      '${r.humidity}%',
                    ),
                    _buildSensorRow(
                      SensorIconTheme.co2,
                      SensorIconTheme.getIconColor('co2'),
                      '${r.co2} ppm',
                    ),
                    _buildSensorRow(
                      SensorIconTheme.light,
                      SensorIconTheme.getIconColor('light'),
                      '${r.lightLevel}%',
                    ),
                    const Spacer(),
                    Row(children: [
                      ElevatedButton(
                        onPressed: () =>
                            s.sendLight(r.id, r.lightLevel > 0 ? 0 : 75),
                        child: const Icon(Icons.power_settings_new),
                      ),
                      const SizedBox(width: VanguardSpacing.md),
                      ElevatedButton(
                        onPressed: () => s.activateMode('night'),
                        child: const Text('Night'),
                      ),
                    ])
                  ],
                ),
              ),
            );
          },
        );
      }),
    );
  }

  Widget _buildSensorRow(IconData icon, Color color, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: VanguardSpacing.xs),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: VanguardSpacing.sm),
          Text(value, style: RoomCardTheme.sensorValueStyle),
        ],
      ),
    );
  }
}
