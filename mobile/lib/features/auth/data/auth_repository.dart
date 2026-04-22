import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/secure_store.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.read(secureStoreProvider),
    ref.read(dioProvider),
  ),
);

class AuthRepository {
  final SecureStore _secureStore;
  final Dio _dio;
  AuthRepository(this._secureStore, this._dio);

  Future<Map<String, dynamic>> getMe() async {
    try {
      final response = await _dio.get('/auth/me');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Unable to fetch profile',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> saveToken(String token) async {
    await _secureStore.saveToken(token);
  }

  Future<String?> currentToken() => _secureStore.readToken();

  Future<Map<String, dynamic>> signInWithToken(String token) async {
    await saveToken(token);
    try {
      return await getMe();
    } catch (e) {
      await _secureStore.clearToken();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _secureStore.clearToken();
  }
}
