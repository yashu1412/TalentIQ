import 'package:flutter/material.dart';
import '../../shared/theme/tiq_theme.dart';
import '../../shared/widgets/tiq_widgets.dart';

class ResumePage extends StatelessWidget {
  const ResumePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Resume Analyzer'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                      color: TIQColors.teal.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.upload_file_rounded, color: TIQColors.teal, size: 30),
                  ),
                  const SizedBox(height: 16),
                  const Text('Upload Your Resume', style: TIQTextStyles.displayMedium),
                  const SizedBox(height: 8),
                  const Text(
                    'PDF format. We will extract and score it against an ATS vocabulary of 2000+ tech keywords.',
                    textAlign: TextAlign.center,
                    style: TIQTextStyles.bodyMedium,
                  ),
                  const SizedBox(height: 24),
                  TIQPrimaryButton(label: 'Select PDF File', color: TIQColors.teal, onPressed: () {}),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            const SectionLabel('CURRENT RESUME INSIGHTS'),
            const SizedBox(height: 16),
            
            GlassCard(
              child: Row(
                children: [
                  const ScoreRing(score: 72, size: 70),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Senior Backend Engineer', style: TIQTextStyles.titleLarge),
                        const SizedBox(height: 4),
                        const Text('Last analyzed 2 days ago', style: TIQTextStyles.bodyMedium),
                        const SizedBox(height: 8),
                        TIQBadge('12 Improvements', color: TIQColors.amber),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
