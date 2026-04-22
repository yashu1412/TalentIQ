import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router_bridge.dart';
import 'router.dart';
import '../shared/theme/tiq_theme.dart';

class TalentIqApp extends ConsumerWidget {
  const TalentIqApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    AppRouterBridge.router = router;
    return MaterialApp.router(
      title: 'TalentIQ',
      debugShowCheckedModeBanner: false,
      theme: TIQTheme.dark,
      darkTheme: TIQTheme.dark,
      themeMode: ThemeMode.dark,
      routerConfig: router,
    );
  }
}
