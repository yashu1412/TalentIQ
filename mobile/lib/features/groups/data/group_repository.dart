import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

// ─── Models ─────────────────────────────────────────────────────────────────

class GroupMember {
  final String id;
  final String email;
  final String fullName;

  const GroupMember({required this.id, required this.email, required this.fullName});

  factory GroupMember.fromJson(Map<String, dynamic> j) => GroupMember(
        id: j['id'] as String,
        email: j['email'] as String,
        fullName: j['full_name'] as String? ?? '',
      );
}

class Group {
  final String id;
  final String name;
  final String description;
  final String creatorId;
  final List<GroupMember> members;

  const Group({
    required this.id,
    required this.name,
    required this.description,
    required this.creatorId,
    required this.members,
  });

  factory Group.fromJson(Map<String, dynamic> j) => Group(
        id: j['id'] as String,
        name: j['name'] as String,
        description: j['description'] as String? ?? '',
        creatorId: j['creator_id'] as String,
        members: (j['members'] as List<dynamic>? ?? [])
            .map((m) => GroupMember.fromJson(m as Map<String, dynamic>))
            .toList(),
      );
}

class GroupMessage {
  final String id;
  final String content;
  final String senderId;
  final String senderName;
  final String senderEmail;
  final DateTime createdAt;

  const GroupMessage({
    required this.id,
    required this.content,
    required this.senderId,
    required this.senderName,
    required this.senderEmail,
    required this.createdAt,
  });

  factory GroupMessage.fromJson(Map<String, dynamic> j) => GroupMessage(
        id: j['id'] as String,
        content: j['content'] as String,
        senderId: j['sender_id'] as String,
        senderName: j['sender_name'] as String? ?? 'Unknown',
        senderEmail: j['sender_email'] as String? ?? '',
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

// ─── Repository ──────────────────────────────────────────────────────────────

final groupRepositoryProvider = Provider<GroupRepository>(
  (ref) => GroupRepository(ref.read(dioProvider)),
);

class GroupRepository {
  final Dio _dio;
  GroupRepository(this._dio);

  Future<List<Group>> listGroups() async {
    try {
      final response = await _dio.get('/groups/');
      return (response.data as List)
          .map((g) => Group.fromJson(g as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load groups',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<Group> createGroup({
    required String name,
    required String description,
    required List<String> memberEmails,
  }) async {
    try {
      final response = await _dio.post('/groups/', data: {
        'name': name,
        'description': description,
        'member_emails': memberEmails,
      });
      return Group.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to create group',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<List<GroupMessage>> getMessages(String groupId) async {
    try {
      final response = await _dio.get('/groups/$groupId/messages');
      return (response.data as List)
          .map((m) => GroupMessage.fromJson(m as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to load messages',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> sendMessage(String groupId, String content) async {
    try {
      await _dio.post('/groups/$groupId/messages', data: {'content': content});
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to send message',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> addMembers(String groupId, List<String> emails) async {
    try {
      await _dio.post('/groups/$groupId/members', data: {'member_emails': emails});
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to add member',
        statusCode: e.response?.statusCode,
      );
    }
  }

  Future<void> deleteGroup(String groupId) async {
    try {
      await _dio.delete('/groups/$groupId');
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to delete group',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
