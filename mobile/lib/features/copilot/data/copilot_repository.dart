import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

final copilotRepositoryProvider = Provider<CopilotRepository>(
  (ref) => CopilotRepository(ref.read(dioProvider)),
);

class CopilotRepository {
  final Dio _dio;
  CopilotRepository(this._dio);

  Future<Map<String, dynamic>> companyPrep({
    required String company,
    required String role,
  }) async {
    try {
      final response = await _dio.post(
        '/copilot/company-prep',
        data: {
          'company': company,
          'role': role,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to generate company prep',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
