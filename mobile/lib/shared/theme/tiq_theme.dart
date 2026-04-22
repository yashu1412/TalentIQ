import 'package:flutter/material.dart';

// ── TalentIQ Design Tokens (from Stitch Design Guide) ──────────────────────
// Source: Black → Blue → White design language

class TIQColors {
  TIQColors._();

  // Backgrounds
  static const bgPrimary   = Color(0xFF0A0A0A);
  static const bgDeep      = Color(0xFF080C14);
  static const bgCard      = Color(0xFF161616);
  static const bgCardHover = Color(0xFF1E1E1E);

  // Borders
  static const borderDefault = Color(0xFF262626);
  static const borderMid     = Color(0xFF333333);

  // Brand blue
  static const primary     = Color(0xFF378ADD);
  static const primaryLight = Color(0xFF60A5FA);
  static const primaryGlow = Color(0x33378ADD);

  // Accent
  static const violet = Color(0xFF8B5CF6);
  static const amber  = Color(0xFFF59E0B);
  static const rose   = Color(0xFFF43F5E);
  static const teal   = Color(0xFF14B8A6);
  static const green  = Color(0xFF22C55E);

  // Text
  static const textPrimary = Color(0xFFFFFFFF);
  static const textMuted   = Color(0xFFA1A1AA);
  static const textDim     = Color(0xFF71717A);
}

class TIQTextStyles {
  TIQTextStyles._();

  static const displayLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: FontWeight.w800,
    color: TIQColors.textPrimary,
    letterSpacing: -0.5,
  );

  static const displayMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: TIQColors.textPrimary,
  );

  static const titleLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: TIQColors.textPrimary,
  );

  static const bodyLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: TIQColors.textPrimary,
    height: 1.6,
  );

  static const bodyMedium = TextStyle(
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: TIQColors.textMuted,
    height: 1.5,
  );

  static const labelSmall = TextStyle(
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: FontWeight.w600,
    color: TIQColors.textMuted,
    letterSpacing: 0.8,
  );

  static const mono = TextStyle(
    fontFamily: 'monospace',
    fontSize: 11,
    color: TIQColors.primary,
    letterSpacing: 0.5,
  );
}

class TIQTheme {
  TIQTheme._();

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: TIQColors.bgPrimary,
        colorScheme: const ColorScheme.dark(
          primary: TIQColors.primary,
          surface: TIQColors.bgCard,
          onPrimary: Colors.white,
          onSurface: TIQColors.textPrimary,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: TIQColors.bgPrimary,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          iconTheme: IconThemeData(color: TIQColors.textPrimary),
          titleTextStyle: TextStyle(
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: TIQColors.textPrimary,
          ),
        ),
        cardTheme: CardThemeData(
          color: TIQColors.bgCard,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: TIQColors.borderDefault),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: TIQColors.bgCard,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: TIQColors.borderDefault),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: TIQColors.borderDefault),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: TIQColors.primary, width: 1.5),
          ),
          hintStyle: TIQTextStyles.bodyMedium,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: TIQColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontFamily: 'Inter',
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: TIQColors.bgCard,
          selectedItemColor: TIQColors.primary,
          unselectedItemColor: TIQColors.textDim,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
        ),
      );
}
