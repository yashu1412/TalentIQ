import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/splash_page.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/analytics/presentation/analytics_page.dart';
import '../features/copilot/presentation/copilot_page.dart';
import '../features/dashboard/presentation/dashboard_page.dart';
import '../features/interview/presentation/interview_page.dart';
import '../features/interview/presentation/interview_replay_page.dart';
import '../features/interview/presentation/interview_report_page.dart';
import '../features/job_analysis/presentation/job_analysis_page.dart';
import '../features/resume/presentation/resume_page.dart';
import '../features/roadmap/presentation/roadmap_page.dart';
import '../features/tracker/presentation/tracker_page.dart';
import '../features/groups/presentation/groups_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier();
  ref.onDispose(refresh.dispose);
  ref.listen<AuthState>(authControllerProvider, (_, __) {
    refresh.notify();
  });

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isLoading = authState.loading;
      final isAuthed = authState.authenticated;
      final location = state.matchedLocation;
      final atSplash = location == '/splash';
      final atLogin = location == '/login';

      if (isLoading) return null;
      if (!isAuthed && !atLogin && !atSplash) return '/login';
      if (isAuthed && (atLogin || atSplash)) return '/dashboard';
      if (!isAuthed && atSplash) return '/login';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (_, __) => const DashboardPage(),
      ),
      GoRoute(
        path: '/tracker',
        builder: (_, state) => TrackerPage(
          initialAppId: state.uri.queryParameters['appId'],
        ),
      ),
      GoRoute(
        path: '/analytics',
        builder: (_, __) => const AnalyticsPage(),
      ),
      GoRoute(
        path: '/roadmap',
        builder: (_, state) => RoadmapPage(
          initialRole: state.uri.queryParameters['role'],
          initialWeeks: int.tryParse(state.uri.queryParameters['weeks'] ?? ''),
        ),
      ),
      GoRoute(
        path: '/interview',
        builder: (_, __) => const InterviewPage(),
      ),
      GoRoute(
        path: '/interview/:interviewId/report',
        builder: (_, state) => InterviewReportPage(
          interviewId: state.pathParameters['interviewId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/interview/:interviewId/replay',
        builder: (_, state) => InterviewReplayPage(
          interviewId: state.pathParameters['interviewId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/resume',
        builder: (_, __) => const ResumePage(),
      ),
      GoRoute(
        path: '/copilot',
        builder: (_, state) => CopilotPage(
          initialCompany: state.uri.queryParameters['company'],
          initialRole: state.uri.queryParameters['role'],
        ),
      ),
      GoRoute(
        path: '/job-analysis',
        builder: (_, __) => const JobAnalysisPage(),
      ),
      GoRoute(
        path: '/groups',
        builder: (_, __) => const GroupsPage(),
      ),
    ],
  );
});

class _RouterRefreshNotifier extends ChangeNotifier {
  void notify() => notifyListeners();
}
