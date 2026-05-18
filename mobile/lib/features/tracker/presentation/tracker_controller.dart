import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/tracker_repository.dart';
import '../data/tracker_models.dart';

// ─── State ────────────────────────────────────────────────────────────────────

class TrackerState {
  final List<ApplicationItem> applications;
  final bool loading;
  final String? error;
  final String selectedFilter;

  const TrackerState({
    this.applications = const [],
    this.loading = false,
    this.error,
    this.selectedFilter = 'all',
  });

  TrackerState copyWith({
    List<ApplicationItem>? applications,
    bool? loading,
    String? error,
    String? selectedFilter,
    bool clearError = false,
  }) {
    return TrackerState(
      applications: applications ?? this.applications,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      selectedFilter: selectedFilter ?? this.selectedFilter,
    );
  }

  List<ApplicationItem> get filtered {
    if (selectedFilter == 'all') return applications;
    return applications.where((a) => a.status == selectedFilter).toList();
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

final trackerControllerProvider =
    StateNotifierProvider<TrackerController, TrackerState>(
  (ref) => TrackerController(ref.read(trackerRepositoryProvider))..load(),
);

const trackerStatuses = ['all', 'saved', 'applied', 'interviewing', 'offer', 'rejected'];

class TrackerController extends StateNotifier<TrackerState> {
  final TrackerRepository _repo;
  TrackerController(this._repo) : super(const TrackerState());

  Future<void> load() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final apps = await _repo.listApplications();
      state = state.copyWith(loading: false, applications: apps);
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }

  void setFilter(String filter) {
    state = state.copyWith(selectedFilter: filter);
  }

  Future<void> addApplication({
    required String title,
    required String company,
    String status = 'saved',
  }) async {
    try {
      await _repo.createApplication(title: title, company: company, status: status);
      await load();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> updateStatus(String id, String newStatus) async {
    // Optimistic update
    final updated = state.applications.map((a) {
      return a.id == id ? ApplicationItem(id: a.id, status: newStatus, title: a.title, company: a.company, jobId: a.jobId) : a;
    }).toList();
    state = state.copyWith(applications: updated);

    try {
      await _repo.updateApplicationStatus(applicationId: id, status: newStatus);
    } catch (e) {
      // Roll back on failure
      await load();
    }
  }
}
