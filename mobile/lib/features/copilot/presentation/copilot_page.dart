import 'package:flutter/material.dart';
import '../../shared/theme/tiq_theme.dart';
import '../../shared/widgets/tiq_widgets.dart';

class CopilotPage extends StatefulWidget {
  const CopilotPage({super.key, this.initialCompany, this.initialRole});
  final String? initialCompany;
  final String? initialRole;

  @override
  State<CopilotPage> createState() => _CopilotPageState();
}

class _CopilotPageState extends State<CopilotPage> {
  final _messageController = TextEditingController();

  Widget _buildChatBubble(String text, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? TIQColors.primary : TIQColors.bgCard,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
          ),
          border: isUser ? null : Border.all(color: TIQColors.borderDefault),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isUser ? Colors.white : TIQColors.textPrimary,
            fontSize: 14,
            height: 1.5,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: TIQColors.primary.withOpacity(0.2),
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
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Center(
                  child: TIQBadge('Today', color: TIQColors.textDim),
                ),
                const SizedBox(height: 24),
                _buildChatBubble('Hello Alex! I am your AI Career Copilot. How can I help you today? You can ask me to draft cover letters, simulate interview questions, or negotiate salaries.', false),
                _buildChatBubble('Can you review my recent resume upload for Google?', true),
                _buildChatBubble('Absolutely. I see your resume has a strong focus on distributed systems, which aligns perfectly with Google. However, I noticed you are missing GCP and Kubernetes keywords. I recommend adding your cloud migration project specifically to highlight this. Want me to draft a bullet point?', false),
              ],
            ),
          ),
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
                    decoration: InputDecoration(
                      hintText: 'Ask your copilot...',
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
                    color: TIQColors.primary,
                    boxShadow: [
                      BoxShadow(color: TIQColors.primary.withOpacity(0.4), blurRadius: 10),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
