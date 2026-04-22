import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/theme/tiq_theme.dart';
import '../../../shared/widgets/tiq_widgets.dart';
import 'auth_controller.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _tokenController = TextEditingController();

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  Future<void> _saveToken() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) return;
    try {
      await ref.read(authControllerProvider.notifier).signInWithToken(token);
      final state = ref.read(authControllerProvider);
      if (!mounted) return;
      if (state.authenticated) {
        context.go('/dashboard');
      } else if (state.error != null) {
        _showError(state.error!);
      }
    } catch (e) {
      if (!mounted) return;
      _showError(e.toString());
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: TIQColors.rose,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget _buildFeatureLine(IconData icon, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: TIQColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: TIQColors.primary.withOpacity(0.2)),
            ),
            child: Icon(icon, color: TIQColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TIQTextStyles.titleLarge.copyWith(fontSize: 16)),
                const SizedBox(height: 4),
                Text(desc, style: TIQTextStyles.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    
    return Scaffold(
      body: Stack(
        children: [
          // Background Glows
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: TIQColors.primary.withOpacity(0.1),
                boxShadow: [BoxShadow(color: TIQColors.primary.withOpacity(0.1), blurRadius: 100, spreadRadius: 50)],
              ),
            ),
          ),
          
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: TIQColors.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: TIQColors.primary.withOpacity(0.4), blurRadius: 10)],
                    ),
                    child: const Icon(Icons.bolt, color: Colors.white, size: 30),
                  ),
                  const SizedBox(height: 24),
                  const Text('Welcome to TalentIQ', style: TIQTextStyles.displayLarge),
                  const SizedBox(height: 8),
                  Text('Your AI Career Copilot in your pocket.', style: TIQTextStyles.bodyLarge),
                  const SizedBox(height: 48),
                  
                  // Onboarding Features
                  _buildFeatureLine(Icons.description_outlined, 'AI Resume Analysis', 'Instant ATS scoring and feedback.'),
                  _buildFeatureLine(Icons.mic_none_outlined, 'Mock Interviews', 'Practice with real-time AI coaching.'),
                  _buildFeatureLine(Icons.map_outlined, 'Career Roadmaps', '12-week AI-generated learning paths.'),
                  
                  const SizedBox(height: 48),
                  
                  // Dev Token Input (for now)
                  GlassCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('Developer Mode'),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _tokenController,
                          style: TIQTextStyles.bodyLarge,
                          decoration: const InputDecoration(
                            labelText: 'Paste Bearer Token',
                            prefixIcon: Icon(Icons.key, color: TIQColors.textDim),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TIQPrimaryButton(
                          label: 'Continue',
                          icon: Icons.arrow_forward_rounded,
                          loading: authState.loading,
                          onPressed: _saveToken,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
