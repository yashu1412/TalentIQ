import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final offlineCacheProvider = Provider<OfflineCache>((ref) => OfflineCache());

class OfflineCache {
  static const _prefix = 'talentiq_cache_';

  Future<void> writeJson(String key, Object value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_prefix$key', jsonEncode(value));
    await prefs.setInt('$_prefix${key}_ts', DateTime.now().millisecondsSinceEpoch);
  }

  Future<Map<String, dynamic>?> readMap(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_prefix$key');
    if (raw == null) return null;
    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) return decoded;
    return null;
  }

  Future<List<Map<String, dynamic>>?> readListOfMap(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('$_prefix$key');
    if (raw == null) return null;
    final decoded = jsonDecode(raw);
    if (decoded is! List) return null;
    return decoded.map((item) => (item as Map).cast<String, dynamic>()).toList();
  }

  Future<int?> lastUpdatedEpochMs(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('$_prefix${key}_ts');
  }
}
