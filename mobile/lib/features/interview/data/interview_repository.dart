import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

final interviewRepositoryProvider = Provider<InterviewRepository>(
  (ref) => InterviewRepository(ref.read(dioProvider)),
);

class InterviewRepository {
  final Dio _dio;
  InterviewRepository(this._dio);

  Future<Map<String, dynamic>> startInterview({
    required String type,
    required String difficulty,
    required String persona,
  }) async {
    try {
      final response = await _dio.post(
        '/interviews/start',
        data: {
          'type': type,
          'mode': 'text',
          'difficulty': difficulty,
          'persona': persona,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to start interview',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> submitAnswer({
    required String interviewId,
    required String questionId,
    required String answerText,
  }) async {
    try {
      final response = await _dio.post(
        '/interviews/$interviewId/answer',
        data: {
          'question_id': questionId,
          'answer_text': answerText,
        },
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to submit answer',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> finishInterview(String interviewId) async {
    try {
      final response = await _dio.post('/interviews/$interviewId/finish');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to finish interview',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> getReport(String interviewId) async {
    try {
      final response = await _dio.get('/interviews/$interviewId/report');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load report',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Map<String, dynamic>> getReplay(String interviewId) async {
    try {
      final response = await _dio.get('/interviews/$interviewId/replay');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load replay',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
