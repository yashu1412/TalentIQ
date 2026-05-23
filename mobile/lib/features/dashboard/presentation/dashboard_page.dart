import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import '../../auth/presentation/auth_controller.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  Widget _buildQuickAction(BuildContext context, String title, IconData icon, Color color, String route) {
    return GestureDetector(
      onTap: () => context.push(route),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withValues(alpha: 0.3)),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TIQTextStyles.titleLarge.copyWith(fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return TIQShell(
      currentIndex: 0,
      onTap: (idx) {
        if (idx == 1) context.push('/resume');
        if (idx == 2) context.push('/copilot');
        if (idx == 3) context.push('/interview');
      },
      child: Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: TIQColors.primary,
                  borderRadius: BorderRadius.circular(8),
                   boxShadow: [
                    BoxShadow(
                      color: TIQColors.primary.withValues(alpha: 0.3),
                      blurRadius: 8,
                    )
                   ]
                ),
                child: const Icon(Icons.bolt, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('TalentIQ'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout, size: 20, color: TIQColors.textDim),
              onPressed: () async {
                await ref.read(authControllerProvider.notifier).signOut();
                if (context.mounted) context.go('/login');
              },
            ),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          children: [
            // Hero Welcome
            Text('Welcome back,', style: TIQTextStyles.bodyLarge.copyWith(color: TIQColors.textMuted)),
            Text(
              ref.watch(authControllerProvider).user?['full_name'] as String? ?? 'there',
              style: TIQTextStyles.displayLarge,
            ),
            const SizedBox(height: 24),

            // AI Status Card
            GlassCard(
              gradient: true,
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('AI CAREER SCORE'),
                        const SizedBox(height: 8),
                        Text(
                          'Your profile is highly competitive for Senior Backend Engineer roles.',
                          style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.textPrimary),
                        ),
                        const SizedBox(height: 16),
                        const TIQBadge('Update Resume', color: TIQColors.violet),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  const ScoreRing(score: 84),
                ],
              ),
            ),

            const SizedBox(height: 32),
            const SectionLabel('Quick Actions'),
            const SizedBox(height: 16),

            // Actions Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.1,
              children: [
                _buildQuickAction(context, 'Mock Interview', Icons.mic_rounded, TIQColors.violet, '/interview'),
                _buildQuickAction(context, 'Resume AI', Icons.description_rounded, TIQColors.teal, '/resume'),
                _buildQuickAction(context, 'Roadmap', Icons.map_rounded, TIQColors.amber, '/roadmap'),
                _buildQuickAction(context, 'Copilot', Icons.smart_toy_rounded, TIQColors.primary, '/copilot'),
                _buildQuickAction(context, 'Job Match', Icons.work_outline_rounded, TIQColors.rose, '/job-analysis'),
                _buildQuickAction(context, 'Tracker', Icons.view_kanban_rounded, TIQColors.green, '/tracker'),
                _buildQuickAction(context, 'Group Chat', Icons.group_rounded, const Color(0xFF10B981), '/groups'),
                _buildQuickAction(context, 'Analytics', Icons.bar_chart_rounded, TIQColors.amber, '/analytics'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
