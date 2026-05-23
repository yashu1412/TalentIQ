import 'package:flutter/material.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';

class RoadmapPage extends StatelessWidget {
  const RoadmapPage({super.key, this.initialRole, this.initialWeeks});
  final String? initialRole;
  final int? initialWeeks;

  Widget _buildWeekCard(int week, String title, String desc, bool isCompleted) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: isCompleted ? TIQColors.primary : TIQColors.bgCard,
                  shape: BoxShape.circle,
                  border: Border.all(color: isCompleted ? TIQColors.primary : TIQColors.borderDefault),
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : Text('$week', style: TIQTextStyles.labelSmall),
                ),
              ),
              Container(
                width: 2,
                height: 60,
                color: isCompleted ? TIQColors.primary.withValues(alpha: 0.5) : TIQColors.borderDefault,
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Week $week', style: TIQTextStyles.labelSmall),
                      if (isCompleted) const TIQBadge('Done', color: TIQColors.green),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(title, style: TIQTextStyles.titleLarge),
                  const SizedBox(height: 4),
                  Text(desc, style: TIQTextStyles.bodyMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = initialRole ?? 'Software Engineer';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Career Roadmap'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('12-Week Prep:', style: TIQTextStyles.bodyLarge),
            Text(role, style: TIQTextStyles.displayMedium),
            const SizedBox(height: 32),
            
            _buildWeekCard(1, 'System Design Fundamentals', 'Reviewing load balancers, caching, and database scaling.', true),
            _buildWeekCard(2, 'Data Structures & Algorithms', 'Graphs, Trees, and Dynamic Programming refresh.', true),
            _buildWeekCard(3, 'Behavioral Interview', 'Drafting STAR method stories for common leadership principles.', false),
            _buildWeekCard(4, 'Mock Interviews', 'Live practice with peer networks and AI feedback.', false),
          ],
        ),
      ),
    );
  }
}
