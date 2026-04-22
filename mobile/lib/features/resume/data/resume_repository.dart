import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

final resumeRepositoryProvider = Provider<ResumeRepository>(
  (ref) => ResumeRepository(ref.read(dioProvider)),
);

class ResumeRepository {
  final Dio _dio;
  ResumeRepository(this._dio);

  Future<List<Map<String, dynamic>>> listResumes() async {
    try {
      final response = await _dio.get('/resumes');
      return (response.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load resumes',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> uploadResume(String filePath) async {
    try {
      final file = File(filePath);
      final fileName = file.uri.pathSegments.isNotEmpty ? file.uri.pathSegments.last : 'resume.pdf';
      final formData = FormData.fromMap(
        {
          'file': await MultipartFile.fromFile(file.path, filename: fileName, contentType: DioMediaType('application', 'pdf')),
        },
      );
      final response = await _dio.post('/resumes/upload', data: formData);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to upload resume',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> getResume(String resumeId) async {
    try {
      final response = await _dio.get('/resumes/$resumeId');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to fetch resume details',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> improveResume({
    required String resumeId,
    required String section,
  }) async {
    try {
      final response = await _dio.post('/resumes/$resumeId/improve', data: {'section': section});
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to improve resume',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getVersions(String resumeId) async {
    try {
      final response = await _dio.get('/resumes/$resumeId/versions');
      return (response.data as List).cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load versions',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> writingAssistant({
    required String task,
    required String context,
  }) async {
    try {
      final response = await _dio.post(
        '/copilot/writing-assistant',
        data: {'task': task, 'context': context},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to generate writing assistance',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
