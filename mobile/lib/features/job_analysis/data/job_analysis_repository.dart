import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

final jobAnalysisRepositoryProvider = Provider<JobAnalysisRepository>(
  (ref) => JobAnalysisRepository(ref.read(dioProvider)),
);

class JobAnalysisRepository {
  final Dio _dio;
  JobAnalysisRepository(this._dio);

  Future<Map<String, dynamic>> analyzeJob({
    String? jdText,
    String? url,
  }) async {
    try {
      final response = await _dio.post(
        '/jobs/analyze',
        data: {
          if (jdText != null && jdText.trim().isNotEmpty) 'jd_text': jdText.trim(),
          if (url != null && url.trim().isNotEmpty) 'url': url.trim(),
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to analyze job',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> getJob(String jobId) async {
    try {
      final response = await _dio.get('/jobs/$jobId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load job details',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> simulateAts({
    required String resumeId,
    required String jobId,
  }) async {
    try {
      final response = await _dio.post(
        '/matches/ats-simulate',
        data: {
          'resume_id': resumeId,
          'job_id': jobId,
          'compare_latest_versions': true,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to run ATS simulation',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
