import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final secureStoreProvider = Provider<SecureStore>((ref) => SecureStore());

class SecureStore {
  static const _tokenKey = 'auth_token';
  
  // Web specific options are required to handle persistence correctly in Chrome
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    webOptions: WebOptions(
      dbName: 'talentiq_auth',
      publicKey: 'talentiq_pk',
    ),
  );

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }


  Future<String?> readToken() async {
    return _storage.read(key: _tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }
}
