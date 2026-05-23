import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'dart:convert' as dart_convert;
import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';

// ─── Message model ────────────────────────────────────────────────────────────

class ChatMessage {
  final String content;
  final bool isUser;
  const ChatMessage({required this.content, required this.isUser});
}

// ─── State ────────────────────────────────────────────────────────────────────

class CopilotState {
  final List<ChatMessage> messages;
  final bool sending;
  final String? error;

  const CopilotState({
    this.messages = const [],
    this.sending = false,
    this.error,
  });

  CopilotState copyWith({
    List<ChatMessage>? messages,
    bool? sending,
    String? error,
    bool clearError = false,
  }) {
    return CopilotState(
      messages: messages ?? this.messages,
      sending: sending ?? this.sending,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ─── Chat repository extension ────────────────────────────────────────────────

final _chatDioProvider = Provider<Dio>((ref) => ref.read(dioProvider));

class ChatRepo {
  final Dio _dio;
  ChatRepo(this._dio);

  Future<String> chat(String message, List<Map<String, String>> history) async {
    try {
      final response = await _dio.post(
        '/copilot/chat',
        data: {
          'message': message,
          'history': history,
        },
        options: Options(responseType: ResponseType.stream),
      );

      final stream = (response.data as ResponseBody).stream;
      String fullReply = '';
      String buffer = '';
      
      await for (final chunk in stream) {
        final text = dart_convert.utf8.decode(chunk, allowMalformed: true);
        buffer += text;
        
        while (buffer.contains('\n\n')) {
          final index = buffer.indexOf('\n\n');
          final msg = buffer.substring(0, index);
          buffer = buffer.substring(index + 2);
          
          if (msg.startsWith('data: ')) {
            final dataStr = msg.substring(6).trim();
            if (dataStr == '[DONE]') continue;
            if (dataStr.isNotEmpty) {
              try {
                final json = dart_convert.jsonDecode(dataStr);
                if (json['delta'] != null) {
                  fullReply += json['delta'];
                } else if (json['error'] != null) {
                  throw ApiException(json['error'].toString());
                }
              } catch (_) {}
            }
          }
        }
      }
      return fullReply.isNotEmpty ? fullReply : 'No response from AI.';
    } on DioException catch (e) {
      throw ApiException(
        e.response?.data?['detail']?.toString() ?? 'Failed to get AI response',
        statusCode: e.response?.statusCode,
      );
    }
  }
}

final _chatRepoProvider = Provider<ChatRepo>(
  (ref) => ChatRepo(ref.read(_chatDioProvider)),
);

// ─── Controller ───────────────────────────────────────────────────────────────

final copilotControllerProvider =
    StateNotifierProvider<CopilotController, CopilotState>(
  (ref) => CopilotController(ref.read(_chatRepoProvider)),
);

class CopilotController extends StateNotifier<CopilotState> {
  final ChatRepo _repo;

  CopilotController(this._repo)
      : super(
          const CopilotState(
            messages: [
              ChatMessage(
                content:
                    'Hello! I\'m your AI Career Copilot. Ask me to help with cover letters, interview prep, salary negotiation, or career advice.',
                isUser: false,
              ),
            ],
          ),
        );

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty || state.sending) return;
    final userMsg = ChatMessage(content: text.trim(), isUser: true);
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      sending: true,
      clearError: true,
    );

    try {
      final history = state.messages
          .where((m) => !m.isUser || m != userMsg)
          .map((m) => {'role': m.isUser ? 'user' : 'assistant', 'content': m.content})
          .toList();

      final reply = await _repo.chat(text.trim(), history);
      final aiMsg = ChatMessage(content: reply, isUser: false);
      state = state.copyWith(
        messages: [...state.messages, aiMsg],
        sending: false,
      );
    } catch (e) {
      const errorMsg = ChatMessage(
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
      );
      state = state.copyWith(
        messages: [...state.messages, errorMsg],
        sending: false,
        error: e.toString(),
      );
    }
  }
}
