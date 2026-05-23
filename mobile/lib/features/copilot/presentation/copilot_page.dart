import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import 'copilot_controller.dart';

class CopilotPage extends ConsumerStatefulWidget {
  const CopilotPage({super.key, this.initialCompany, this.initialRole});
  final String? initialCompany;
  final String? initialRole;

  @override
  ConsumerState<CopilotPage> createState() => _CopilotPageState();
}

class _CopilotPageState extends ConsumerState<CopilotPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    if (widget.initialCompany != null && widget.initialRole != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(copilotControllerProvider.notifier).sendMessage(
            'Help me prepare for an interview at ${widget.initialCompany} for the ${widget.initialRole} role.');
      });
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    _messageController.clear();
    await ref.read(copilotControllerProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  Widget _buildChatBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser ? TIQColors.primary : TIQColors.bgCard,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
          ),
          border: isUser ? null : Border.all(color: TIQColors.borderDefault),
        ),
        child: Text(
          msg.content,
          style: TextStyle(
            color: isUser ? Colors.white : TIQColors.textPrimary,
            fontSize: 14,
            height: 1.5,
            fontFamily: 'Inter',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(copilotControllerProvider);

    // Auto-scroll when messages update
    ref.listen(copilotControllerProvider, (_, __) => _scrollToBottom());

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: TIQColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.smart_toy_rounded, size: 16, color: TIQColors.primary),
            ),
            const SizedBox(width: 8),
            const Text('AI Copilot'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              itemCount: state.messages.length + (state.sending ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (i == state.messages.length) {
                  // Typing indicator
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: TIQColors.bgCard,
                        borderRadius: BorderRadius.circular(16).copyWith(bottomLeft: Radius.zero),
                        border: Border.all(color: TIQColors.borderDefault),
                      ),
                      child: const SizedBox(
                        width: 40,
                        child: LinearProgressIndicator(
                          color: TIQColors.primary,
                          backgroundColor: TIQColors.borderDefault,
                        ),
                      ),
                    ),
                  );
                }
                return _buildChatBubble(state.messages[i]);
              },
            ),
          ),

          // Input bar
          Container(
            padding: const EdgeInsets.all(16).copyWith(bottom: 32),
            decoration: const BoxDecoration(
              color: TIQColors.bgPrimary,
              border: Border(top: BorderSide(color: TIQColors.borderDefault)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onSubmitted: (_) => _send(),
                    decoration: InputDecoration(
                      hintText: 'Ask your copilot…',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: TIQColors.bgCard,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: state.sending ? TIQColors.textDim : TIQColors.primary,
                    boxShadow: [
                      BoxShadow(color: TIQColors.primary.withValues(alpha: 0.4), blurRadius: 10),
                    ],
                  ),
                  child: IconButton(
                    icon: state.sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    onPressed: state.sending ? null : _send,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
