import 'package:dio/dio.dart';
import '../storage/secure_store.dart';

class AuthInterceptor extends Interceptor {
  final SecureStore secureStore;

  AuthInterceptor(this.secureStore);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await secureStore.readToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }
}
