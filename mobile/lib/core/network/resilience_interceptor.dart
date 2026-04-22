import 'dart:async';
import 'dart:math';
import 'package:dio/dio.dart';
import '../telemetry/telemetry_service.dart';

class ResilienceInterceptor extends Interceptor {
  final Dio dio;
  final int maxRetries;
  final Duration baseDelay;

  ResilienceInterceptor({
    required this.dio,
    this.maxRetries = 2,
    this.baseDelay = const Duration(milliseconds: 300),
  });

  static const _retryableMethods = {'GET', 'HEAD', 'OPTIONS'};
  static const _retryableStatusCodes = {408, 425, 429, 500, 502, 503, 504};

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final method = err.requestOptions.method.toUpperCase();
    final currentRetry = (err.requestOptions.extra['retry_count'] as int?) ?? 0;
    final shouldRetryMethod = _retryableMethods.contains(method);
    final statusCode = err.response?.statusCode;
    final shouldRetryStatus = statusCode != null && _retryableStatusCodes.contains(statusCode);
    final networkFailure = err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError;

    if (!shouldRetryMethod || currentRetry >= maxRetries || (!shouldRetryStatus && !networkFailure)) {
      TelemetryService.error(
        'HTTP request failed',
        error: err,
        stackTrace: err.stackTrace,
        context: {
          'method': method,
          'path': err.requestOptions.path,
          'statusCode': statusCode,
          'retryCount': currentRetry,
        },
      );
      return handler.next(err);
    }

    final retryCount = currentRetry + 1;
    final jitterMs = Random().nextInt(150);
    final delay = baseDelay * (1 << (retryCount - 1)) + Duration(milliseconds: jitterMs);
    await Future<void>.delayed(delay);

    final options = err.requestOptions;
    options.extra['retry_count'] = retryCount;
    TelemetryService.info(
      'Retrying HTTP request',
      context: {
        'method': method,
        'path': options.path,
        'retryCount': retryCount,
        'statusCode': statusCode,
      },
    );

    try {
      final response = await dio.fetch<dynamic>(options);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }
}
