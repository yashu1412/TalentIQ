import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  static String _flavor = 'dev';

  static void setFlavor(String flavor) {
    _flavor = flavor.trim().isEmpty ? 'dev' : flavor.trim();
  }

  static String get flavor => _flavor;

  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/v1';

  static bool get isProduction => _flavor == 'prod';
}
