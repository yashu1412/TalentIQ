import 'package:flutter/material.dart';
import '../../shared/theme/tiq_theme.dart';

// ── Reusable glass card ────────────────────────────────────────────────────

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.gradient = false,
    this.accentColor,
  });

  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets? margin;
  final bool gradient;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final accent = accentColor ?? TIQColors.primary;
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: TIQColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: gradient ? accent.withValues(alpha: 0.3) : TIQColors.borderDefault,
        ),
        gradient: gradient
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  accent.withValues(alpha: 0.08),
                  TIQColors.bgCard,
                ],
              )
            : null,
      ),
      child: child,
    );
  }
}

// ── Primary glow button ────────────────────────────────────────────────────

class TIQPrimaryButton extends StatelessWidget {
  const TIQPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
    this.color,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final bg = color ?? TIQColors.primary;
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          shadowColor: bg.withValues(alpha: 0.5),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18, color: Colors.white),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Section label  ─────────────────────────────────────────────────────────

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: TIQTextStyles.labelSmall.copyWith(
          color: TIQColors.primary,
          letterSpacing: 1.5,
        ),
      );
}

// ── Mono badge ─────────────────────────────────────────────────────────────

class TIQBadge extends StatelessWidget {
  const TIQBadge(this.label, {super.key, this.color});
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? TIQColors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: c.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TIQTextStyles.labelSmall.copyWith(color: c),
      ),
    );
  }
}

// ── Score ring ─────────────────────────────────────────────────────────────

class ScoreRing extends StatelessWidget {
  const ScoreRing({super.key, required this.score, this.size = 80});
  final int score;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = score >= 75
        ? TIQColors.green
        : score >= 50
            ? TIQColors.amber
            : TIQColors.rose;
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CircularProgressIndicator(
            value: score / 100,
            strokeWidth: 6,
            backgroundColor: TIQColors.borderDefault,
            valueColor: AlwaysStoppedAnimation(color),
          ),
          Text(
            '$score',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: size * 0.22,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bottom nav shell ───────────────────────────────────────────────────────

class TIQShell extends StatefulWidget {
  const TIQShell({super.key, required this.child, required this.currentIndex, required this.onTap});
  final Widget child;
  final int currentIndex;
  final void Function(int) onTap;

  @override
  State<TIQShell> createState() => _TIQShellState();
}

class _TIQShellState extends State<TIQShell> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: TIQColors.bgPrimary,
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: TIQColors.bgCard,
          border: Border(top: BorderSide(color: TIQColors.borderDefault)),
        ),
        child: BottomNavigationBar(
          currentIndex: widget.currentIndex,
          onTap: widget.onTap,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: TIQColors.primary,
          unselectedItemColor: TIQColors.textDim,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 10, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Inter', fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.description_outlined), activeIcon: Icon(Icons.description), label: 'Resume'),
            BottomNavigationBarItem(icon: Icon(Icons.smart_toy_outlined), activeIcon: Icon(Icons.smart_toy), label: 'Copilot'),
            BottomNavigationBarItem(icon: Icon(Icons.mic_outlined), activeIcon: Icon(Icons.mic), label: 'Interview'),
            BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), activeIcon: Icon(Icons.bar_chart), label: 'More'),
          ],
        ),
      ),
    );
  }
}
