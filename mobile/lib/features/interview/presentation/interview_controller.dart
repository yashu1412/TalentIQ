import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/interview_repository.dart';

// ─── State ────────────────────────────────────────────────────────────────────

enum InterviewStatus { config, starting, inProgress, submitting, finished, error }

class InterviewState {
  final InterviewStatus status;
  final String selectedRole;
  final String selectedRound;
  final String? interviewId;
  final Map<String, dynamic>? currentQuestion;
  final int questionIndex;
  final int totalQuestions;
  final Map<String, dynamic>? lastScore;
  final Map<String, dynamic>? report;
  final String? error;

  const InterviewState({
    this.status = InterviewStatus.config,
    this.selectedRole = 'Software Engineer',
    this.selectedRound = 'Behavioral & Leadership',
    this.interviewId,
    this.currentQuestion,
    this.questionIndex = 0,
    this.totalQuestions = 5,
    this.lastScore,
    this.report,
    this.error,
  });

  InterviewState copyWith({
    InterviewStatus? status,
    String? selectedRole,
    String? selectedRound,
    String? interviewId,
    Map<String, dynamic>? currentQuestion,
    int? questionIndex,
    int? totalQuestions,
    Map<String, dynamic>? lastScore,
    Map<String, dynamic>? report,
    String? error,
    bool clearError = false,
  }) {
    return InterviewState(
      status: status ?? this.status,
      selectedRole: selectedRole ?? this.selectedRole,
      selectedRound: selectedRound ?? this.selectedRound,
      interviewId: interviewId ?? this.interviewId,
      currentQuestion: currentQuestion ?? this.currentQuestion,
      questionIndex: questionIndex ?? this.questionIndex,
      totalQuestions: totalQuestions ?? this.totalQuestions,
      lastScore: lastScore ?? this.lastScore,
      report: report ?? this.report,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

final interviewControllerProvider =
    StateNotifierProvider<InterviewController, InterviewState>(
  (ref) => InterviewController(ref.read(interviewRepositoryProvider)),
);

const _roles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
  'ML Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
  'System Design',
];

const _rounds = [
  'Behavioral & Leadership',
  'Coding & DS/Algo',
  'System Design',
  'Product Sense',
  'Culture Fit',
];

final interviewRolesProvider = Provider<List<String>>((_) => _roles);
final interviewRoundsProvider = Provider<List<String>>((_) => _rounds);

class InterviewController extends StateNotifier<InterviewState> {
  final InterviewRepository _repo;
  InterviewController(this._repo) : super(const InterviewState());

  void setRole(String role) => state = state.copyWith(selectedRole: role);
  void setRound(String round) => state = state.copyWith(selectedRound: round);

  Future<void> startInterview() async {
    state = state.copyWith(status: InterviewStatus.starting, clearError: true);
    try {
      final result = await _repo.startInterview(
        type: state.selectedRole,
        difficulty: 'medium',
        persona: 'balanced',
      );
      final question = result['question'] as Map<String, dynamic>? ??
          result['current_question'] as Map<String, dynamic>?;
      final total = (result['total_questions'] as num?)?.toInt() ?? 5;
      state = state.copyWith(
        status: InterviewStatus.inProgress,
        interviewId: result['interview_id']?.toString() ?? result['id']?.toString(),
        currentQuestion: question,
        questionIndex: 0,
        totalQuestions: total,
      );
    } catch (e) {
      state = state.copyWith(status: InterviewStatus.error, error: e.toString());
    }
  }

  Future<void> submitAnswer(String answerText) async {
    if (state.interviewId == null || state.currentQuestion == null) return;
    state = state.copyWith(status: InterviewStatus.submitting, clearError: true);
    try {
      final result = await _repo.submitAnswer(
        interviewId: state.interviewId!,
        questionId: state.currentQuestion!['id']?.toString() ?? '',
        answerText: answerText,
      );

      final nextQuestion = result['next_question'] as Map<String, dynamic>?;
      final isFinished = result['finished'] as bool? ?? (nextQuestion == null);

      if (isFinished) {
        await _finishAndLoadReport();
      } else {
        state = state.copyWith(
          status: InterviewStatus.inProgress,
          currentQuestion: nextQuestion,
          questionIndex: state.questionIndex + 1,
          lastScore: result['score'] as Map<String, dynamic>?,
        );
      }
    } catch (e) {
      state = state.copyWith(status: InterviewStatus.error, error: e.toString());
    }
  }

  Future<void> _finishAndLoadReport() async {
    try {
      await _repo.finishInterview(state.interviewId!);
      final report = await _repo.getReport(state.interviewId!);
      state = state.copyWith(status: InterviewStatus.finished, report: report);
    } catch (e) {
      state = state.copyWith(status: InterviewStatus.error, error: e.toString());
    }
  }

  void reset() => state = const InterviewState();
}
