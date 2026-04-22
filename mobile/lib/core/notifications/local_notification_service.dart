import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../../app/router_bridge.dart';

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    tz.initializeTimeZones();

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null && payload.isNotEmpty) {
          AppRouterBridge.router?.go(payload);
        }
      },
    );

    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    await _plugin
        .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);
    _initialized = true;
  }

  static NotificationDetails _details() {
    return const NotificationDetails(
      android: AndroidNotificationDetails(
        'talentiq_reminders',
        'TalentIQ Reminders',
        channelDescription: 'Interview, tracker, and roadmap reminders',
        importance: Importance.max,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
  }

  static int _idFromKey(String key) => key.hashCode & 0x7fffffff;

  static Future<void> scheduleReminder({
    required String key,
    required String title,
    required String body,
    required DateTime when,
    required String routePayload,
  }) async {
    await initialize();
    final id = _idFromKey(key);
    final scheduled = tz.TZDateTime.from(when, tz.local);
    if (scheduled.isBefore(tz.TZDateTime.now(tz.local))) return;
    await _plugin.zonedSchedule(
      id,
      title,
      body,
      scheduled,
      _details(),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      payload: routePayload,
      matchDateTimeComponents: null,
    );
  }

  static Future<void> cancelByKey(String key) async {
    await initialize();
    await _plugin.cancel(_idFromKey(key));
  }

  static Future<void> showNow({
    required String key,
    required String title,
    required String body,
    required String routePayload,
  }) async {
    await initialize();
    await _plugin.show(_idFromKey(key), title, body, _details(), payload: routePayload);
  }
}
