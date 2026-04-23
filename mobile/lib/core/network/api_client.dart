import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/env.dart';
import '../storage/secure_store.dart';
import 'auth_interceptor.dart';
import 'resilience_interceptor.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppEnv.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );
  dio.interceptors.add(AuthInterceptor(ref.read(secureStoreProvider)));
  dio.interceptors.add(
    ResilienceInterceptor(dio: dio),
  );
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) {
      if (options.path.startsWith('/')) {
        options.path = options.path.substring(1);
      }
      return handler.next(options);
    },
  ));
  return dio;
});
