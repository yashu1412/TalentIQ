import 'package:flutter/material.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';

class JobAnalysisPage extends StatefulWidget {
  const JobAnalysisPage({super.key});

  @override
  State<JobAnalysisPage> createState() => _JobAnalysisPageState();
}

class _JobAnalysisPageState extends State<JobAnalysisPage> {
  final _jdController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Match Analysis'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Paste Job Description',
              style: TIQTextStyles.displayMedium,
            ),
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
                hintText: 'Paste the requirements and description here...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 24),
            TIQPrimaryButton(
              label: 'Analyze Match',
              color: TIQColors.primary,
              icon: Icons.analytics_rounded,
              onPressed: () {
                // To simulation logic
              },
            ),
          ],
        ),
      ),
    );
  }
}
