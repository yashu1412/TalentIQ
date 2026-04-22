import 'package:flutter/material.dart';
import '../../shared/theme/tiq_theme.dart';
import '../../shared/widgets/tiq_widgets.dart';
import 'package:go_router/go_router.dart';

class InterviewPage extends StatelessWidget {
  const InterviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mock Interview'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Spacer(),
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: TIQColors.violet.withOpacity(0.1),
                  border: Border.all(color: TIQColors.violet.withOpacity(0.3), width: 2),
                ),
                child: const Icon(Icons.mic_none_rounded, size: 60, color: TIQColors.violet),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Ready for your interview?',
              style: TIQTextStyles.displayMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            const Text(
              'Our AI will ask you a series of role-specific questions and record your responses for analysis.',
              style: TIQTextStyles.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const Spacer(),
            
            // Configuration
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionLabel('Role'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: 'Software Engineer',
                    decoration: const InputDecoration(isDense: true),
                    items: const [
                      DropdownMenuItem(value: 'Software Engineer', child: Text('Software Engineer')),
                      DropdownMenuItem(value: 'Product Manager', child: Text('Product Manager')),
                    ],
                    onChanged: (val) {},
                  ),
                  const SizedBox(height: 16),
                  const SectionLabel('Round Type'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: 'Behavioral & Leadership',
                    decoration: const InputDecoration(isDense: true),
                    items: const [
                      DropdownMenuItem(value: 'Coding & DS/Algo', child: Text('Coding & DS/Algo')),
                      DropdownMenuItem(value: 'Behavioral & Leadership', child: Text('Behavioral & Leadership')),
                    ],
                    onChanged: (val) {},
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            TIQPrimaryButton(
              label: 'Start Session',
              color: TIQColors.violet,
              icon: Icons.play_arrow_rounded,
              onPressed: () {
                // To simulation (omitted for presentation wrapper)
                context.push('/interview/123/report'); 
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
