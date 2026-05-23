import 'package:flutter/material.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';

class AnalyticsPage extends StatelessWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            GlassCard(
              gradient: true,
              accentColor: TIQColors.primary,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionLabel('Total Applications'),
                  const SizedBox(height: 8),
                  const Text('124', style: TIQTextStyles.displayLarge),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildStatColumn('Interviews', '12', TIQColors.amber),
                      _buildStatColumn('Offers', '2', TIQColors.green),
                      _buildStatColumn('Rejects', '45', TIQColors.rose),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SectionLabel('Interview Performance'),
                  const SizedBox(height: 24),
                  // Placeholder for chart
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: TIQColors.bgPrimary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: TIQColors.borderDefault),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.show_chart, size: 40, color: TIQColors.primary.withValues(alpha: 0.5)),
                          const SizedBox(height: 8),
                          const Text('Trend Chart Placeholder', style: TIQTextStyles.labelSmall),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TIQTextStyles.bodyMedium),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          )
        ],
      ),
    );
  }
}
