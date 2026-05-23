import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/storage/offline_cache.dart';
import 'tracker_models.dart';

final trackerRepositoryProvider = Provider<TrackerRepository>(
  (ref) => TrackerRepository(
    ref.read(dioProvider),
    ref.read(offlineCacheProvider),
  ),
);

class TrackerRepository {
  final Dio _dio;
  final OfflineCache _cache;
  TrackerRepository(this._dio, this._cache);

  Future<List<ApplicationItem>> listApplications() async {
    try {
      final response = await _dio.get('/applications');
      final rawData = (response.data as List).cast<Map<String, dynamic>>();
      await _cache.writeJson('tracker_applications', rawData);
      final data = rawData
          .map((e) => ApplicationItem.fromJson(e))
          .toList();
      return data;
    } on DioException catch (e) {
      final cached = await _cache.readListOfMap('tracker_applications');
      if (cached != null) {
        return cached.map(ApplicationItem.fromJson).toList();
      }
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load applications',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<String> createApplication({
    required String title,
    required String company,
    String? jobId,
    String status = 'saved',
    String? nextStep,
    DateTime? reminderAt,
  }) async {
    try {
      final response = await _dio.post(
        '/applications',
        data: {
          'job_id': jobId ?? 'manual-${DateTime.now().millisecondsSinceEpoch}',
          'title': title,
          'company': company,
          'status': status,
          'next_step': nextStep,
          'reminder_at': reminderAt?.toUtc().toIso8601String(),
        },
      );
      return response.data['id']?.toString() ?? '';
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to create application',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> updateApplicationStatus({
    required String applicationId,
    required String status,
  }) async {
    try {
      await _dio.patch(
        '/applications/$applicationId',
        data: {'status': status},
      );
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to update application',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> updateApplicationDetails({
    required String applicationId,
    String? title,
    String? company,
    String? status,
    String? nextStep,
    DateTime? reminderAt,
  }) async {
    try {
      await _dio.patch(
        '/applications/$applicationId',
        data: {
          'title': title,
          'company': company,
          'status': status,
          'next_step': nextStep,
          'reminder_at': reminderAt?.toUtc().toIso8601String(),
        }..removeWhere((key, value) => value == null),
      );
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to update application',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
