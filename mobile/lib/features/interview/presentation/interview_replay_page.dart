import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/interview_repository.dart';

final interviewReplayProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, interviewId) async {
  return ref.read(interviewRepositoryProvider).getReplay(interviewId);
});

class InterviewReplayPage extends ConsumerWidget {
  final String interviewId;
  const InterviewReplayPage({super.key, required this.interviewId});

  Color _scoreColor(int score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final replayAsync = ref.watch(interviewReplayProvider(interviewId));
    return Scaffold(
      appBar: AppBar(title: const Text('Replay Timeline')),
      body: replayAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load replay: $e')),
        data: (replay) {
          final timeline = (replay['timeline'] as List?)?.cast<Map<String, dynamic>>() ?? const [];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: ListTile(
                  title: Text('Overall Score: ${replay['overall_score'] ?? 0}'),
                  subtitle: Text('Persona: ${replay['persona'] ?? 'balanced'}'),
                ),
              ),
              const SizedBox(height: 10),
              if (timeline.isEmpty)
                const Text('No replay timeline available yet.')
              else
                ...timeline.map((item) {
                  final score = (item['score'] as num?)?.toInt() ?? 0;
                  final delta = (item['delta'] as num?)?.toInt() ?? 0;
                  final deltaPositive = delta >= 0;
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 14,
                                backgroundColor: _scoreColor(score).withValues(alpha: 0.12),
                                child: Text(
                                  '${item['sequence'] ?? '-'}',
                                  style: TextStyle(color: _scoreColor(score), fontWeight: FontWeight.w700),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Score: $score',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: _scoreColor(score),
                                  ),
                                ),
                              ),
                              Text(
                                '${deltaPositive ? '+' : ''}$delta',
                                style: TextStyle(
                                  color: deltaPositive ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text('Q: ${item['question'] ?? '-'}'),
                          const SizedBox(height: 6),
                          Text('A: ${item['answer'] ?? '-'}'),
                          const SizedBox(height: 6),
                          Text('Feedback: ${item['feedback'] ?? '-'}'),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}
