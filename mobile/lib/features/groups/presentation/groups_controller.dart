import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/group_repository.dart';

// ─── State ───────────────────────────────────────────────────────────────────

class GroupsState {
  final bool loading;
  final List<Group> groups;
  final Group? selectedGroup;
  final List<GroupMessage> messages;
  final bool messagesLoading;
  final String? error;

  const GroupsState({
    this.loading = false,
    this.groups = const [],
    this.selectedGroup,
    this.messages = const [],
    this.messagesLoading = false,
    this.error,
  });

  GroupsState copyWith({
    bool? loading,
    List<Group>? groups,
    Group? selectedGroup,
    bool clearSelectedGroup = false,
    List<GroupMessage>? messages,
    bool? messagesLoading,
    String? error,
    bool clearError = false,
  }) {
    return GroupsState(
      loading: loading ?? this.loading,
      groups: groups ?? this.groups,
      selectedGroup: clearSelectedGroup ? null : (selectedGroup ?? this.selectedGroup),
      messages: messages ?? this.messages,
      messagesLoading: messagesLoading ?? this.messagesLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ─── Controller ──────────────────────────────────────────────────────────────

final groupsControllerProvider = StateNotifierProvider<GroupsController, GroupsState>(
  (ref) => GroupsController(ref.read(groupRepositoryProvider)),
);

class GroupsController extends StateNotifier<GroupsState> {
  final GroupRepository _repo;
  GroupsController(this._repo) : super(const GroupsState());

  Future<void> loadGroups() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final groups = await _repo.listGroups();
      state = state.copyWith(loading: false, groups: groups);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  void selectGroup(Group group) {
    state = state.copyWith(selectedGroup: group, messages: []);
    loadMessages(group.id);
  }

  void clearGroup() {
    state = state.copyWith(clearSelectedGroup: true, messages: []);
  }

  Future<void> loadMessages(String groupId) async {
    state = state.copyWith(messagesLoading: true);
    try {
      final messages = await _repo.getMessages(groupId);
      state = state.copyWith(messagesLoading: false, messages: messages);
    } catch (e) {
      state = state.copyWith(messagesLoading: false, error: e.toString());
    }
  }

  Future<void> sendMessage(String groupId, String content) async {
    try {
      await _repo.sendMessage(groupId, content);
      await loadMessages(groupId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> createGroup({
    required String name,
    required String description,
    required List<String> memberEmails,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await _repo.createGroup(name: name, description: description, memberEmails: memberEmails);
      await loadGroups();
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<void> deleteGroup(String groupId) async {
    try {
      await _repo.deleteGroup(groupId);
      state = state.copyWith(clearSelectedGroup: true, messages: []);
      await loadGroups();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}
