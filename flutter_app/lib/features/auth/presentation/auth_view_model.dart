import 'package:injectable/injectable.dart';
import 'package:signals/signals.dart';

import '../../../core/error.dart';
import '../domain/models/auth_user.dart';
import '../domain/repositories/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

@injectable
final class AuthViewModel {
  AuthViewModel(this._authRepository);

  final AuthRepository _authRepository;

  final _status = signal<AuthStatus>(AuthStatus.unknown);
  final _currentUser = signal<AuthUser?>(null);
  final _isLoading = signal<bool>(false);
  final _error = signal<String?>(null);

  ReadonlySignal<AuthStatus> get status => _status;
  ReadonlySignal<AuthUser?> get currentUser => _currentUser;
  ReadonlySignal<bool> get isLoading => _isLoading;
  ReadonlySignal<String?> get error => _error;

  Future<void> checkAuthStatus() async {
    final isLoggedIn = await _authRepository.isLoggedIn;
    if (isLoggedIn) {
      final result = await _authRepository.getMe();
      result.fold(
        (_) => _status.value = AuthStatus.unauthenticated,
        (user) {
          _currentUser.value = user;
          _status.value = AuthStatus.authenticated;
        },
      );
    } else {
      _status.value = AuthStatus.unauthenticated;
    }
  }

  Future<bool> isLoggedIn() => _authRepository.isLoggedIn;

  Future<bool> login({required String email, required String password}) async {
    _isLoading.value = true;
    _error.value = null;
    final result = await _authRepository.login(email: email, password: password);
    _isLoading.value = false;
    return result.fold(
      (err) {
        _error.value = _mapError(err);
        return false;
      },
      (_) async {
        await checkAuthStatus();
        return true;
      },
    );
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    _isLoading.value = true;
    _error.value = null;
    final result = await _authRepository.register(
      email: email,
      password: password,
      fullName: fullName,
    );
    _isLoading.value = false;
    return result.fold(
      (err) {
        _error.value = _mapError(err);
        return false;
      },
      (_) async {
        await checkAuthStatus();
        return true;
      },
    );
  }

  Future<void> logout() async {
    await _authRepository.logout();
    _currentUser.value = null;
    _status.value = AuthStatus.unauthenticated;
  }

  String _mapError(NetworkError err) => switch (err) {
        Unauthorized() => 'Email hoặc mật khẩu không đúng.',
        BadRequest() => 'Thông tin không hợp lệ.',
        _ => 'Đã xảy ra lỗi. Vui lòng thử lại.',
      };
}
