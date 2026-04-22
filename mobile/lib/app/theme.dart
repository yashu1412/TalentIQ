import 'package:flutter/material.dart';

const _primary = Color(0xFF2563EB);
const _darkBg = Color(0xFF0A0A0A);
const _lightBg = Color(0xFFEEF4FF);

ThemeData get lightTheme => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primary,
        brightness: Brightness.light,
        surface: Colors.white,
      ),
      scaffoldBackgroundColor: _lightBg,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: const CardThemeData(
        elevation: 8,
        shadowColor: Color(0x33000000),
      ),
    );

ThemeData get darkTheme => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: _darkBg,
    );
