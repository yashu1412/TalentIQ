import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import 'interview_controller.dart';

class InterviewPage extends ConsumerStatefulWidget {
  const InterviewPage({super.key});

  @override
  ConsumerState<InterviewPage> createState() => _InterviewPageState();
}

class _InterviewPageState extends ConsumerState<InterviewPage> {
  final _answerController = TextEditingController();

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(interviewControllerProvider);
    final ctrl = ref.read(interviewControllerProvider.notifier);

    switch (state.status) {
      case InterviewStatus.config:
        return _buildConfig(state, ctrl);
      case InterviewStatus.starting:
        return _buildLoading('Starting interview…');
      case InterviewStatus.inProgress:
        return _buildQuestion(state, ctrl);
      case InterviewStatus.submitting:
        return _buildLoading('Evaluating your answer…');
      case InterviewStatus.finished:
        return _buildReport(state, ctrl);
      case InterviewStatus.error:
        return _buildError(state, ctrl);
    }
  }

  Widget _buildConfig(InterviewState state, InterviewController ctrl) {
    final roles = ref.watch(interviewRolesProvider);
    final rounds = ref.watch(interviewRoundsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mock Interview')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Spacer(),
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: TIQColors.violet.withValues(alpha: 0.1),
                  border: Border.all(color: TIQColors.violet.withValues(alpha: 0.3), width: 2),
                ),
                child: const Icon(Icons.mic_none_rounded, size: 60, color: TIQColors.violet),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Ready for your interview?', style: TIQTextStyles.displayMedium, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            const Text(
              'Our AI will ask you role-specific questions and give you detailed feedback on each answer.',
              style: TIQTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const Spacer(),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionLabel('Role'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: state.selectedRole,
                    decoration: const InputDecoration(isDense: true),
                    items: roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) { if (val != null) ctrl.setRole(val); },
                  ),
                  const SizedBox(height: 16),
                  const SectionLabel('Round Type'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: state.selectedRound,
                    decoration: const InputDecoration(isDense: true),
                    items: rounds.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                    onChanged: (val) { if (val != null) ctrl.setRound(val); },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            TIQPrimaryButton(
              label: 'Start Session',
              color: TIQColors.violet,
              icon: Icons.play_arrow_rounded,
              onPressed: ctrl.startInterview,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading(String message) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: TIQColors.violet),
            const SizedBox(height: 20),
            Text(message, style: TIQTextStyles.bodyMedium),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestion(InterviewState state, InterviewController ctrl) {
    final question = state.currentQuestion;
    final questionText = question?['question_text']?.toString() ??
        question?['text']?.toString() ??
        'Next question…';
    final progress = (state.questionIndex + 1) / state.totalQuestions;

    return Scaffold(
      appBar: AppBar(
        title: Text('Q${state.questionIndex + 1} of ${state.totalQuestions}'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            showDialog(
              context: context,
              builder: (_) => AlertDialog(
                backgroundColor: TIQColors.bgCard,
                title: const Text('End Interview?', style: TextStyle(color: TIQColors.textPrimary)),
                content: const Text('Your progress will be lost.', style: TextStyle(color: TIQColors.textDim)),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                  TextButton(
                    onPressed: () { Navigator.pop(context); ctrl.reset(); },
                    child: const Text('End', style: TextStyle(color: TIQColors.rose)),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Progress bar
            LinearProgressIndicator(
              value: progress,
              color: TIQColors.violet,
              backgroundColor: TIQColors.borderDefault,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 24),

            // Question
            GlassCard(
              gradient: true,
              accentColor: TIQColors.violet,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TIQBadge(state.selectedRole, color: TIQColors.violet),
                  const SizedBox(height: 12),
                  Text(questionText, style: TIQTextStyles.titleLarge.copyWith(height: 1.5)),
                ],
              ),
            ),

            const SizedBox(height: 20),
            const SectionLabel('YOUR ANSWER'),
            const SizedBox(height: 12),

            Expanded(
              child: TextField(
                controller: _answerController,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Type your answer here…',
                  alignLabelWithHint: true,
                ),
              ),
            ),

            const SizedBox(height: 20),
            TIQPrimaryButton(
              label: state.questionIndex + 1 >= state.totalQuestions ? 'Finish & Get Report' : 'Submit Answer',
              color: TIQColors.violet,
              icon: state.questionIndex + 1 >= state.totalQuestions ? Icons.flag_rounded : Icons.send_rounded,
              onPressed: () {
                final answer = _answerController.text.trim();
                if (answer.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please type your answer before submitting.')),
                  );
                  return;
                }
                _answerController.clear();
                ctrl.submitAnswer(answer);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildReport(InterviewState state, InterviewController ctrl) {
    final report = state.report ?? {};
    final overallScore = (report['overall_score'] as num?)?.toInt() ?? 0;
    final feedback = report['coaching_summary']?.toString() ?? report['summary']?.toString() ?? '';
    final questions = (report['questions'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Interview Report'),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: ctrl.reset),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GlassCard(
              gradient: true,
              accentColor: TIQColors.violet,
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  ScoreRing(score: overallScore, size: 80),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Overall Score', style: TIQTextStyles.labelSmall),
                        const SizedBox(height: 4),
                        Text(
                          overallScore >= 70 ? 'Great Performance! 🎉' : overallScore >= 50 ? 'Good Effort' : 'Keep Practicing',
                          style: TIQTextStyles.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        TIQBadge('${state.selectedRole} · ${state.selectedRound}', color: TIQColors.violet),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (feedback.isNotEmpty) ...[
              const SizedBox(height: 20),
              const SectionLabel('AI COACHING'),
              const SizedBox(height: 12),
              GlassCard(child: Text(feedback, style: TIQTextStyles.bodyMedium.copyWith(height: 1.6))),
            ],

            if (questions.isNotEmpty) ...[
              const SizedBox(height: 20),
              const SectionLabel('QUESTION BREAKDOWN'),
              const SizedBox(height: 12),
              ...questions.asMap().entries.map((entry) {
                final i = entry.key;
                final q = entry.value;
                final qScore = (q['score'] as num?)?.toInt() ?? 0;
                return GlassCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          TIQBadge('Q${i + 1}', color: TIQColors.violet),
                          const Spacer(),
                          TIQBadge('$qScore / 100', color: qScore >= 70 ? TIQColors.green : TIQColors.amber),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(q['question_text']?.toString() ?? '', style: TIQTextStyles.titleLarge.copyWith(fontSize: 14)),
                      if (q['feedback'] != null) ...[
                        const SizedBox(height: 8),
                        Text(q['feedback'].toString(), style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.textMuted)),
                      ],
                    ],
                  ),
                );
              }),
            ],

            const SizedBox(height: 24),
            TIQPrimaryButton(
              label: 'Practice Again',
              color: TIQColors.violet,
              icon: Icons.replay_rounded,
              onPressed: ctrl.reset,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildError(InterviewState state, InterviewController ctrl) {
    return Scaffold(
      appBar: AppBar(title: const Text('Interview Error')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: TIQColors.rose, size: 60),
              const SizedBox(height: 16),
              Text(state.error ?? 'An unexpected error occurred', style: TIQTextStyles.bodyMedium, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              TIQPrimaryButton(label: 'Try Again', color: TIQColors.rose, icon: Icons.refresh, onPressed: ctrl.reset),
            ],
          ),
        ),
      ),
    );
  }
}
