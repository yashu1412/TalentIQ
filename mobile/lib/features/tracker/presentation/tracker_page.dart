import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import '../data/tracker_models.dart';
import 'tracker_controller.dart';

class TrackerPage extends ConsumerWidget {
  const TrackerPage({super.key, this.initialAppId});
  final String? initialAppId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(trackerControllerProvider);
    final ctrl = ref.read(trackerControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Application Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddDialog(context, ctrl),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter pills
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: trackerStatuses.map((status) {
                final isActive = state.selectedFilter == status;
                final count = status == 'all'
                    ? state.applications.length
                    : state.applications.where((a) => a.status == status).length;
                return GestureDetector(
                  onTap: () => ctrl.setFilter(status),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive ? TIQColors.primary : TIQColors.bgCard,
                      borderRadius: BorderRadius.circular(20),
                      border: isActive ? null : Border.all(color: TIQColors.borderDefault),
                    ),
                    child: Text(
                      '${_labelFor(status)} ($count)',
                      style: TextStyle(
                        color: isActive ? Colors.white : TIQColors.textMuted,
                        fontSize: 13,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Content
          Expanded(
            child: state.loading
                ? const Center(child: CircularProgressIndicator(color: TIQColors.primary))
                : state.error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline, color: TIQColors.rose, size: 40),
                            const SizedBox(height: 12),
                            Text(state.error!, style: TIQTextStyles.bodyMedium, textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: TIQColors.primary),
                              onPressed: ctrl.load,
                              child: const Text('Retry', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      )
                    : state.filtered.isEmpty
                        ? const Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.work_outline, size: 60, color: TIQColors.borderDefault),
                                SizedBox(height: 16),
                                Text('No applications yet', style: TIQTextStyles.titleLarge),
                                SizedBox(height: 8),
                                Text('Tap + to add your first application', style: TIQTextStyles.bodyMedium),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            color: TIQColors.primary,
                            onRefresh: ctrl.load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: state.filtered.length,
                              itemBuilder: (ctx, i) {
                                final app = state.filtered[i];
                                return _buildAppCard(context, app, ctrl);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppCard(BuildContext context, ApplicationItem app, TrackerController ctrl) {
    final statusColor = _colorForStatus(app.status);
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  app.company ?? 'Unknown Company',
                  style: TIQTextStyles.labelSmall,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TIQBadge(_labelFor(app.status), color: statusColor),
            ],
          ),
          const SizedBox(height: 8),
          Text(app.title ?? 'Untitled Role', style: TIQTextStyles.titleLarge),
          if (app.nextStep != null) ...[
            const SizedBox(height: 4),
            Text('Next: ${app.nextStep}', style: TIQTextStyles.bodyMedium.copyWith(color: TIQColors.amber)),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.swap_horiz, size: 14, color: TIQColors.textDim),
              const SizedBox(width: 4),
              const Text('Move to:', style: TIQTextStyles.bodyMedium),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: trackerStatuses
                        .where((s) => s != 'all' && s != app.status)
                        .map((s) => GestureDetector(
                              onTap: () => ctrl.updateStatus(app.id, s),
                              child: Container(
                                margin: const EdgeInsets.only(right: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _colorForStatus(s).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: _colorForStatus(s).withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  _labelFor(s),
                                  style: TextStyle(color: _colorForStatus(s), fontSize: 11, fontFamily: 'Inter'),
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddDialog(BuildContext context, TrackerController ctrl) {
    final titleCtrl = TextEditingController();
    final companyCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: TIQColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Application', style: TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              style: const TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter'),
              decoration: const InputDecoration(labelText: 'Job Title', prefixIcon: Icon(Icons.work_outline)),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: companyCtrl,
              style: const TextStyle(color: TIQColors.textPrimary, fontFamily: 'Inter'),
              decoration: const InputDecoration(labelText: 'Company', prefixIcon: Icon(Icons.business_outlined)),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: TIQColors.textDim))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: TIQColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            onPressed: () {
              Navigator.pop(ctx);
              ctrl.addApplication(title: titleCtrl.text.trim(), company: companyCtrl.text.trim());
            },
            child: const Text('Add', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  String _labelFor(String status) {
    const labels = {
      'all': 'All',
      'saved': 'Saved',
      'applied': 'Applied',
      'interviewing': 'Interviewing',
      'offer': 'Offer',
      'rejected': 'Rejected',
    };
    return labels[status] ?? status;
  }

  Color _colorForStatus(String status) {
    switch (status) {
      case 'saved': return TIQColors.textDim;
      case 'applied': return TIQColors.primary;
      case 'interviewing': return TIQColors.amber;
      case 'offer': return TIQColors.green;
      case 'rejected': return TIQColors.rose;
      default: return TIQColors.textMuted;
    }
  }
}
