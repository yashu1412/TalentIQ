import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

class TelemetryService {
  static void info(String message, {Map<String, Object?> context = const {}}) {
    final payload = _encodePayload(message: message, context: context, level: 'info');
    developer.log(payload, name: 'TalentIQ.Telemetry');
  }

  static void error(
    String message, {
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?> context = const {},
  }) {
    final merged = {
      ...context,
      if (error != null) 'error': error.toString(),
      if (stackTrace != null) 'stackTrace': stackTrace.toString(),
    };
    final payload = _encodePayload(message: message, context: merged, level: 'error');
    developer.log(payload, name: 'TalentIQ.Telemetry', level: 1000);
    if (kDebugMode) {
      debugPrint(payload);
    }
  }

  static String _encodePayload({
    required String message,
    required Map<String, Object?> context,
    required String level,
  }) {
    final event = {
      'level': level,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
      'context': context,
    };
    return jsonEncode(event);
  }
}
