import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import 'job_analysis_controller.dart';

class JobAnalysisPage extends ConsumerStatefulWidget {
  const JobAnalysisPage({super.key});

  @override
  ConsumerState<JobAnalysisPage> createState() => _JobAnalysisPageState();
}

class _JobAnalysisPageState extends ConsumerState<JobAnalysisPage> {
  final _jdController = TextEditingController();

  @override
  void dispose() {
    _jdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(jobAnalysisControllerProvider);
    final ctrl = ref.read(jobAnalysisControllerProvider.notifier);
    final isLoading = state.status == JobAnalysisStatus.loading;
    final result = state.result;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Match Analysis'),
        actions: [
          if (result != null)
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: ctrl.reset,
              tooltip: 'Analyze again',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (result == null) ...[
              const Text('Paste Job Description', style: TIQTextStyles.displayMedium),
              const SizedBox(height: 8),
              const Text(
                'We will compare your uploaded resume against the job description to calculate your match score and identify missing keywords.',
                style: TIQTextStyles.bodyMedium,
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _jdController,
                maxLines: 8,
                style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Paste the requirements and description here…',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 24),
              if (state.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: TIQColors.rose.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: TIQColors.rose.withValues(alpha: 0.3)),
                  ),
                  child: Text(state.error!, style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.rose)),
                ),
                const SizedBox(height: 16),
              ],
              TIQPrimaryButton(
                label: 'Analyze Match',
                color: TIQColors.primary,
                icon: Icons.analytics_rounded,
                loading: isLoading,
                onPressed: isLoading ? null : () => ctrl.analyze(_jdController.text),
              ),
            ] else ...[
              // Results view
              _ResultsSection(result: result),
            ],
          ],
        ),
      ),
    );
  }
}

class _ResultsSection extends StatelessWidget {
  const _ResultsSection({required this.result});
  final Map<String, dynamic> result;

  @override
  Widget build(BuildContext context) {
    final matchScore = (result['match_score'] as num?)?.toInt() ??
        (result['ats_score'] as num?)?.toInt() ?? 0;
    final missingSkills = (result['missing_skills'] as List?)?.cast<String>() ?? [];
    final matchedSkills = (result['matched_skills'] as List?)?.cast<String>() ?? [];
    final summary = result['summary'] as String? ?? result['analysis'] as String? ?? '';

    final scoreColor = matchScore >= 70
        ? TIQColors.green
        : matchScore >= 40
            ? TIQColors.amber
            : TIQColors.rose;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Score card
        GlassCard(
          gradient: true,
          accentColor: scoreColor,
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              ScoreRing(score: matchScore, size: 80),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Match Score', style: TIQTextStyles.labelSmall.copyWith(color: TIQColors.textMuted)),
                    const SizedBox(height: 4),
                    Text(
                      matchScore >= 70 ? 'Strong Match! 🎉' : matchScore >= 40 ? 'Fair Match' : 'Weak Match',
                      style: TIQTextStyles.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    TIQBadge(
                      matchScore >= 70 ? 'Recommended to Apply' : 'Needs Improvement',
                      color: scoreColor,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        if (summary.isNotEmpty) ...[
          const SizedBox(height: 20),
          const SectionLabel('AI ANALYSIS'),
          const SizedBox(height: 12),
          GlassCard(
            child: Text(summary, style: TIQTextStyles.bodyMedium.copyWith(height: 1.6)),
          ),
        ],

        if (matchedSkills.isNotEmpty) ...[
          const SizedBox(height: 20),
          SectionLabel('✅ MATCHED SKILLS (${matchedSkills.length})'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: matchedSkills.map((s) => TIQBadge(s, color: TIQColors.green)).toList(),
          ),
        ],

        if (missingSkills.isNotEmpty) ...[
          const SizedBox(height: 20),
          SectionLabel('❌ MISSING SKILLS (${missingSkills.length})'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: missingSkills.map((s) => TIQBadge(s, color: TIQColors.rose)).toList(),
          ),
        ],

        const SizedBox(height: 40),
      ],
    );
  }
}
