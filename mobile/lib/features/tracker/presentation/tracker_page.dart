import 'package:flutter/material.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';

class TrackerPage extends StatelessWidget {
  const TrackerPage({super.key, this.initialAppId});
  final String? initialAppId;

  Widget _buildJobCard(String position, String company, String status, Color statusColor) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(company, style: TIQTextStyles.labelSmall),
              TIQBadge(status, color: statusColor),
            ],
          ),
          const SizedBox(height: 8),
          Text(position, style: TIQTextStyles.titleLarge),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: TIQColors.textDim),
              const SizedBox(width: 4),
              Text('Applied 2 days ago', style: TIQTextStyles.bodyMedium),
              const Spacer(),
              Icon(Icons.chevron_right, color: TIQColors.textDim),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Application Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {},
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Filter pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterPill('All (12)', true),
                _buildFilterPill('Applied (5)', false),
                _buildFilterPill('Interviewing (2)', false),
                _buildFilterPill('Rejected (4)', false),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          _buildJobCard('Senior Backend Engineer', 'Google', 'Interviewing', TIQColors.amber),
          _buildJobCard('Infrastructure Software Engineer', 'Stripe', 'Applied', TIQColors.primaryLight),
          _buildJobCard('Backend Developer', 'Netflix', 'Rejected', TIQColors.rose),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String label, bool active) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: active ? TIQColors.primary : TIQColors.bgCard,
        borderRadius: BorderRadius.circular(20),
        border: active ? null : Border.all(color: TIQColors.borderDefault),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? Colors.white : TIQColors.textMuted,
          fontSize: 13,
          fontWeight: active ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
    );
  }
}
