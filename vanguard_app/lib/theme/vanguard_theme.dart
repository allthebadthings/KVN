import 'package:flutter/material.dart';
import 'colors.dart';
import 'typography.dart';
import 'spacing.dart';

class VanguardTheme {
  static ThemeData get darkTheme {
    return ThemeData.dark().copyWith(
      primaryColor: VanguardColors.primary,
      scaffoldBackgroundColor: VanguardColors.background,
      cardColor: VanguardColors.cardBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: VanguardColors.surface,
        elevation: 0,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: VanguardColors.cardBackground,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(VanguardSpacing.md),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: VanguardColors.primary,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(
            horizontal: VanguardSpacing.md,
            vertical: VanguardSpacing.sm,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(VanguardSpacing.sm),
          ),
        ),
      ),
      iconTheme: const IconThemeData(
        color: Colors.white70,
        size: 20,
      ),
      textTheme: const TextTheme(
        bodyLarge: VanguardTypography.sensorValue,
        bodyMedium: VanguardTypography.sensorLabel,
        titleMedium: VanguardTypography.roomName,
      ),
    );
  }
}
