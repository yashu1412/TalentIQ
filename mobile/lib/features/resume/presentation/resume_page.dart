import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import 'resume_controller.dart';

class ResumePage extends ConsumerWidget {
  const ResumePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(resumeControllerProvider);
    final ctrl = ref.read(resumeControllerProvider.notifier);

    final isLoading = state.status == ResumeStatus.uploading ||
        state.status == ResumeStatus.picking;

    final resume = state.resume;
    final atsScore = (resume?['ats_score'] as num?)?.toInt() ?? 0;
    final skills = (resume?['extracted_skills'] as List?)?.cast<String>() ?? [];
    final title = resume?['title'] as String? ?? 'No resume uploaded';

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Resume Analyzer'),
        actions: [
          if (resume != null)
            IconButton(
              icon: const Icon(Icons.refresh_rounded, size: 20),
              onPressed: ctrl.loadResumes,
              tooltip: 'Refresh',
            ),
        ],
      ),
      body: RefreshIndicator(
        color: TIQColors.teal,
        onRefresh: ctrl.loadResumes,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Upload Card
              GlassCard(
                gradient: true,
                accentColor: TIQColors.teal,
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: TIQColors.teal.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isLoading
                            ? Icons.hourglass_top_rounded
                            : Icons.upload_file_rounded,
                        color: TIQColors.teal,
                        size: 30,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Upload Your Resume', style: TIQTextStyles.displayMedium),
                    const SizedBox(height: 8),
                    Text(
                      state.status == ResumeStatus.uploading
                          ? 'Analyzing your resume with AI…'
                          : state.status == ResumeStatus.picking
                              ? 'Opening file picker…'
                              : 'PDF format. We will extract and score it against an ATS vocabulary of 2000+ tech keywords.',
                      textAlign: TextAlign.center,
                      style: TIQTextStyles.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    TIQPrimaryButton(
                      label: isLoading ? 'Processing…' : 'Select PDF File',
                      color: TIQColors.teal,
                      loading: isLoading,
                      onPressed: isLoading ? null : ctrl.pickAndUpload,
                    ),
                    if (state.error != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: TIQColors.rose.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: TIQColors.rose.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          state.error!,
                          style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.rose),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Resume Insights
              if (resume != null) ...[
                const SectionLabel('CURRENT RESUME INSIGHTS'),
                const SizedBox(height: 16),

                GlassCard(
                  child: Row(
                    children: [
                      ScoreRing(score: atsScore, size: 70),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: TIQTextStyles.titleLarge),
                            const SizedBox(height: 4),
                            Text(
                              'ATS Score: $atsScore / 100',
                              style: TIQTextStyles.bodyMedium,
                            ),
                            const SizedBox(height: 8),
                            TIQBadge(
                              atsScore >= 70 ? 'Strong Match' : atsScore >= 40 ? 'Needs Work' : 'Low Score',
                              color: atsScore >= 70 ? TIQColors.green : atsScore >= 40 ? TIQColors.amber : TIQColors.rose,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                if (skills.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionLabel('DETECTED SKILLS'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: skills.take(20).map((s) => TIQBadge(s, color: TIQColors.teal)).toList(),
                  ),
                ],
              ] else ...[
                const SectionLabel('CURRENT RESUME INSIGHTS'),
                const SizedBox(height: 16),
                const GlassCard(
                  child: Column(
                    children: [
                      Icon(Icons.description_outlined, size: 48, color: TIQColors.borderDefault),
                      SizedBox(height: 12),
                      Text('No resume uploaded yet', style: TIQTextStyles.titleLarge),
                      SizedBox(height: 4),
                      Text('Upload your PDF to get your ATS score.', style: TIQTextStyles.bodyMedium),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
