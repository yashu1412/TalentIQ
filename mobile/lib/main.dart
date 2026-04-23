import 'dart:async';
import 'dart:ui';
import 'package:flutter/widgets.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/env.dart';
import 'core/notifications/local_notification_service.dart';
import 'core/telemetry/telemetry_service.dart';
import 'app/app.dart';

Future<void> main() async {
  const envFile = String.fromEnvironment('ENV_FILE', defaultValue: '.env');
  const flavor = String.fromEnvironment('APP_FLAVOR', defaultValue: 'dev');

  WidgetsFlutterBinding.ensureInitialized();
  AppEnv.setFlavor(flavor);
  await dotenv.load(fileName: envFile);
  await LocalNotificationService.initialize();

  TelemetryService.info(
    'Application bootstrap',
    context: {
      'flavor': AppEnv.flavor,
      'envFile': envFile,
      'apiBaseUrl': AppEnv.apiBaseUrl,
    },
  );

  FlutterError.onError = (details) {
    TelemetryService.error(
      'Flutter framework error',
      error: details.exception,
      stackTrace: details.stack,
    );
    FlutterError.presentError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    TelemetryService.error(
      'Uncaught platform error',
      error: error,
      stackTrace: stack,
    );
    return true;
  };

  runApp(const ProviderScope(child: TalentIqApp()));
}
