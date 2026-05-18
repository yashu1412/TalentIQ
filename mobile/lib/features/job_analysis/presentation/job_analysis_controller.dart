import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/job_analysis_repository.dart';

// ─── State ────────────────────────────────────────────────────────────────────

enum JobAnalysisStatus { initial, loading, success, error }

class JobAnalysisState {
  final JobAnalysisStatus status;
  final Map<String, dynamic>? result;
  final String? error;

  const JobAnalysisState({
    this.status = JobAnalysisStatus.initial,
    this.result,
    this.error,
  });

  JobAnalysisState copyWith({
    JobAnalysisStatus? status,
    Map<String, dynamic>? result,
    String? error,
    bool clearError = false,
    bool clearResult = false,
  }) {
    return JobAnalysisState(
      status: status ?? this.status,
      result: clearResult ? null : (result ?? this.result),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

final jobAnalysisControllerProvider =
    StateNotifierProvider<JobAnalysisController, JobAnalysisState>(
  (ref) => JobAnalysisController(ref.read(jobAnalysisRepositoryProvider)),
);

class JobAnalysisController extends StateNotifier<JobAnalysisState> {
  final JobAnalysisRepository _repo;
  JobAnalysisController(this._repo) : super(const JobAnalysisState());

  Future<void> analyze(String jdText) async {
    if (jdText.trim().isEmpty) return;
    state = state.copyWith(status: JobAnalysisStatus.loading, clearError: true, clearResult: true);
    try {
      final result = await _repo.analyzeJob(jdText: jdText.trim());
      state = state.copyWith(status: JobAnalysisStatus.success, result: result);
    } catch (e) {
      state = state.copyWith(status: JobAnalysisStatus.error, error: e.toString());
    }
  }

  void reset() {
    state = const JobAnalysisState();
  }
}
