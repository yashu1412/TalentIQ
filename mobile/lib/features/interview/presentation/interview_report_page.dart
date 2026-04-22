import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/interview_repository.dart';

final interviewReportProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, interviewId) async {
  return ref.read(interviewRepositoryProvider).getReport(interviewId);
});

class InterviewReportPage extends ConsumerWidget {
  final String interviewId;
  const InterviewReportPage({super.key, required this.interviewId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(interviewReportProvider(interviewId));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Interview Report'),
        actions: [
          IconButton(
            onPressed: () => context.push('/interview/$interviewId/replay'),
            icon: const Icon(Icons.timeline),
            tooltip: 'Open Replay',
          ),
        ],
      ),
      body: reportAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load report: $e')),
        data: (report) {
          final questions = (report['questions'] as List?)?.cast<Map<String, dynamic>>() ?? const [];
          final coachingTips = (report['coaching_tips'] as List?)?.cast<dynamic>() ?? const [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: const Text('Overall Score'),
                  trailing: Text('${report['overall_score'] ?? 0}'),
                  subtitle: Text('Persona: ${report['persona'] ?? 'balanced'}'),
                ),
              ),
              const SizedBox(height: 10),
              const Text('Coaching Tips', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              if (coachingTips.isEmpty)
                const Text('No coaching tips available yet.')
              else
                ...coachingTips.map((tip) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.check_circle_outline, size: 18),
                      title: Text(tip.toString()),
                    )),
              const SizedBox(height: 10),
              const Text('Question Analysis', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              ...questions.map(
                (q) => Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(q['text']?.toString() ?? '-', style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        Text('Score: ${q['score'] ?? 0}'),
                        const SizedBox(height: 6),
                        Text('Feedback: ${q['feedback'] ?? 'No feedback'}'),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
