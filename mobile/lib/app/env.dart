import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  static String _flavor = 'dev';

  static void setFlavor(String flavor) {
    _flavor = flavor.trim().isEmpty ? 'dev' : flavor.trim();
  }

  static String get flavor => _flavor;

  /// Returns the correct API base URL depending on platform:
  /// - Android Emulator: 10.0.2.2 maps to the host machine's localhost
  /// - iOS Simulator / other: localhost
  /// - Web (debug): localhost
  /// - .env override: always wins if set
  static String get apiBaseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl.endsWith('/') ? envUrl : '$envUrl/';
    }
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8000/v1/';
    }
    return 'http://localhost:8000/v1/';
  }

  static const String clerkPublishableKey = 'pk_test_Y3JlYXRpdmUta3JpbGwtMjMuY2xlcmsuYWNjb3VudHMuZGV2JA';
  static const String clerkFrontendApi = 'creative-krill-23.clerk.accounts.dev';
  static const String clerkSignInUrl = 'https://creative-krill-23.accounts.dev/sign-in';

  static bool get isProduction => _flavor == 'prod';
}
