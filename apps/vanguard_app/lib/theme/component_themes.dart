import 'package:flutter/material.dart';
import 'colors.dart';
import 'spacing.dart';
import 'typography.dart';

class RoomCardTheme {
  static BoxDecoration get cardDecoration => BoxDecoration(
        color: VanguardColors.cardBackground,
        borderRadius: BorderRadius.circular(VanguardSpacing.md),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      );

  static EdgeInsets get cardPadding => const EdgeInsets.all(VanguardSpacing.md);

  static TextStyle get roomNameStyle => VanguardTypography.roomName;

  static TextStyle get sensorValueStyle => VanguardTypography.sensorValue;
}

class SensorIconTheme {
  static IconData get temperature => Icons.thermostat;
  static IconData get humidity => Icons.water_drop;
  static IconData get co2 => Icons.cloud;
  static IconData get light => Icons.lightbulb;
  static IconData get occupancy => Icons.person;

  static Color getIconColor(String sensorType) {
    switch (sensorType) {
      case 'temperature':
        return VanguardColors.temperature;
      case 'humidity':
        return VanguardColors.humidity;
      case 'co2':
        return VanguardColors.co2;
      case 'light':
        return VanguardColors.light;
      default:
        return Colors.white70;
    }
  }
}
