import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';

class AuthState {
  final bool loading;
  final bool authenticated;
  final String? error;
  final Map<String, dynamic>? user;

  const AuthState({
    this.loading = false,
    this.authenticated = false,
    this.error,
    this.user,
  });

  AuthState copyWith({
    bool? loading,
    bool? authenticated,
    String? error,
    Map<String, dynamic>? user,
  }) {
    return AuthState(
      loading: loading ?? this.loading,
      authenticated: authenticated ?? this.authenticated,
      error: error,
      user: user ?? this.user,
    );
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) => AuthController(ref.read(authRepositoryProvider)),
);

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  AuthController(this._authRepository) : super(const AuthState());

  Future<void> restoreSession() async {
    state = state.copyWith(loading: true, error: null);
    final token = await _authRepository.currentToken();
    if (token == null || token.isEmpty) {
      state = state.copyWith(loading: false, authenticated: false, error: null);
      return;
    }
    try {
      final user = await _authRepository.getMe();
      state = state.copyWith(
        loading: false,
        authenticated: true,
        user: user,
        error: null,
      );
    } catch (e) {
      await _authRepository.logout();
      state = state.copyWith(
        loading: false,
        authenticated: false,
        error: e.toString(),
        user: null,
      );
    }
  }

  Future<void> signInWithToken(String token) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final user = await _authRepository.signInWithToken(token);
      state = state.copyWith(
        loading: false,
        authenticated: true,
        user: user,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(
        loading: false,
        authenticated: false,
        user: null,
        error: e.toString(),
      );
    }
  }

  Future<void> signOut() async {
    state = state.copyWith(loading: true);
    try {
      await _authRepository.logout();
    } finally {
      state = const AuthState(loading: false, authenticated: false);
    }
  }
}
