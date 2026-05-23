import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import '../../auth/presentation/auth_controller.dart';
import '../data/group_repository.dart';
import 'groups_controller.dart';

class GroupsPage extends ConsumerStatefulWidget {
  const GroupsPage({super.key});

  @override
  ConsumerState<GroupsPage> createState() => _GroupsPageState();
}

class _GroupsPageState extends ConsumerState<GroupsPage> {
  final _messageController = TextEditingController();
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(groupsControllerProvider.notifier).loadGroups();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  void _startPolling(String groupId) {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) ref.read(groupsControllerProvider.notifier).loadMessages(groupId);
    });
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  Future<void> _sendMessage() async {
    final group = ref.read(groupsControllerProvider).selectedGroup;
    final content = _messageController.text.trim();
    if (group == null || content.isEmpty) return;
    _messageController.clear();
    await ref.read(groupsControllerProvider.notifier).sendMessage(group.id, content);
  }

  void _showCreateGroupDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final emailsCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: TIQColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Create Group', style: TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter')),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDialogField(nameCtrl, 'Group Name', Icons.group),
              const SizedBox(height: 12),
              _buildDialogField(descCtrl, 'Description (optional)', Icons.description_outlined),
              const SizedBox(height: 12),
              _buildDialogField(emailsCtrl, 'Member emails (comma-separated)', Icons.email_outlined),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: TIQColors.textDim)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TIQColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            onPressed: () async {
              Navigator.pop(ctx);
              final emails = emailsCtrl.text
                  .split(',')
                  .map((e) => e.trim())
                  .where((e) => e.isNotEmpty)
                  .toList();
              await ref.read(groupsControllerProvider.notifier).createGroup(
                    name: nameCtrl.text.trim(),
                    description: descCtrl.text.trim(),
                    memberEmails: emails,
                  );
            },
            child: const Text('Create', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogField(TextEditingController ctrl, String label, IconData icon) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter', fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: TIQColors.textDim, fontSize: 13),
        prefixIcon: Icon(icon, color: TIQColors.textDim, size: 18),
        filled: true,
        fillColor: TIQColors.bgPrimary,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: TIQColors.borderDefault)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: TIQColors.borderDefault)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: TIQColors.primary)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gs = ref.watch(groupsControllerProvider);
    final currentUserId = ref.watch(authControllerProvider).user?['id'] as String? ?? '';

    return TIQShell(
      currentIndex: 0,
      onTap: (_) {},
      child: Scaffold(
        appBar: AppBar(
          leading: gs.selectedGroup != null
              ? IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                  onPressed: () {
                    _stopPolling();
                    ref.read(groupsControllerProvider.notifier).clearGroup();
                  },
                )
              : null,
          title: Text(
            gs.selectedGroup?.name ?? 'Group Chat',
            style: TIQTextStyles.titleLarge,
          ),
          actions: [
            if (gs.selectedGroup == null)
              IconButton(
                icon: const Icon(Icons.add, color: TIQColors.primary),
                onPressed: _showCreateGroupDialog,
              ),
            if (gs.selectedGroup != null)
              IconButton(
                icon: const Icon(Icons.refresh, size: 18, color: TIQColors.textDim),
                onPressed: () => ref.read(groupsControllerProvider.notifier).loadMessages(gs.selectedGroup!.id),
              ),
          ],
        ),
        backgroundColor: TIQColors.bgPrimary,
        body: gs.selectedGroup == null ? _buildGroupList(gs) : _buildChat(gs, currentUserId),
      ),
    );
  }

  Widget _buildGroupList(GroupsState gs) {
    if (gs.loading) {
      return const Center(child: CircularProgressIndicator(color: TIQColors.primary));
    }
    if (gs.error != null) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.error_outline, color: TIQColors.rose, size: 40),
          const SizedBox(height: 12),
          Text(gs.error!, style: const TextStyle(color: TIQColors.textDim), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TIQColors.primary),
            onPressed: () => ref.read(groupsControllerProvider.notifier).loadGroups(),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ]),
      );
    }
    if (gs.groups.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.group_outlined, size: 60, color: TIQColors.borderDefault),
          const SizedBox(height: 16),
          const Text('No groups yet', style: TIQTextStyles.titleLarge),
          const SizedBox(height: 8),
          const Text('Tap + to create your first group', style: TIQTextStyles.bodyMedium),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: TIQColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('Create Group', style: TextStyle(color: Colors.white)),
            onPressed: _showCreateGroupDialog,
          ),
        ]),
      );
    }
    return RefreshIndicator(
      color: TIQColors.primary,
      onRefresh: () => ref.read(groupsControllerProvider.notifier).loadGroups(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: gs.groups.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, i) {
          final group = gs.groups[i];
          return GestureDetector(
            onTap: () {
              ref.read(groupsControllerProvider.notifier).selectGroup(group);
              _startPolling(group.id);
            },
            child: GlassCard(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: TIQColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.group, color: TIQColors.primary),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(group.name, style: TIQTextStyles.titleLarge.copyWith(fontSize: 15)),
                        if (group.description.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(group.description, style: TIQTextStyles.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                        const SizedBox(height: 4),
                        Text('${group.members.length} members', style: const TextStyle(color: TIQColors.primary, fontSize: 11, fontFamily: 'Inter')),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: TIQColors.textDim),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChat(GroupsState gs, String currentUserId) {
    return Column(
      children: [
        // Members strip
        Container(
          height: 40,
          color: TIQColors.bgCard,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: gs.selectedGroup!.members.map((m) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                backgroundColor: TIQColors.primary.withValues(alpha: 0.1),
                side: const BorderSide(color: TIQColors.borderDefault),
                label: Text(m.email, style: const TextStyle(color: TIQColors.primary, fontSize: 11, fontFamily: 'Inter')),
                padding: EdgeInsets.zero,
              ),
            )).toList(),
          ),
        ),

        // Messages
        Expanded(
          child: gs.messagesLoading && gs.messages.isEmpty
              ? const Center(child: CircularProgressIndicator(color: TIQColors.primary))
              : gs.messages.isEmpty
                  ? const Center(child: Text('No messages yet. Say hello! 👋', style: TIQTextStyles.bodyMedium))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: gs.messages.length,
                      itemBuilder: (ctx, i) {
                        final msg = gs.messages[i];
                        final isMe = msg.senderId == currentUserId;
                        return _buildMessageBubble(msg, isMe);
                      },
                    ),
        ),

        // Input bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: const BoxDecoration(
            color: TIQColors.bgCard,
            border: Border(top: BorderSide(color: TIQColors.borderDefault)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: const TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter', fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Type a message…',
                      hintStyle: const TextStyle(color: TIQColors.textDim, fontSize: 14),
                      filled: true,
                      fillColor: TIQColors.bgPrimary,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: TIQColors.primary,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [BoxShadow(color: TIQColors.primary.withValues(alpha: 0.4), blurRadius: 8)],
                    ),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBubble(GroupMessage msg, bool isMe) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            children: [
              Text(msg.senderName, style: TextStyle(color: isMe ? TIQColors.primary : TIQColors.textMuted, fontSize: 11, fontFamily: 'Inter', fontWeight: FontWeight.w600)),
              const SizedBox(width: 4),
              Text('(${msg.senderEmail})', style: const TextStyle(color: TIQColors.textDim, fontSize: 10, fontFamily: 'Inter')),
              const SizedBox(width: 4),
              Text(
                '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                style: const TextStyle(color: TIQColors.textDim, fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Container(
            constraints: const BoxConstraints(maxWidth: 260),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? TIQColors.primary.withValues(alpha: 0.2) : TIQColors.bgCard,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 16),
              ),
              border: Border.all(color: isMe ? TIQColors.primary.withValues(alpha: 0.3) : TIQColors.borderDefault),
            ),
            child: Text(msg.content, style: const TextStyle(color: TIQColors.textPrimary, fontSize: 14, fontFamily: 'Inter')),
          ),
        ],
      ),
    );
  }
}
