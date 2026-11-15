import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/auth/token_manager.dart';
import '../../../../core/error.dart';
import '../../domain/models/auth_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../sources/auth_api.dart';

@LazySingleton(as: AuthRepository)
final class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._authApi, this._tokenManager);

  final AuthApi _authApi;
  final TokenManager _tokenManager;

  @override
  Future<Either<NetworkError, AuthTokens>> login({
    required String email,
    required String password,
  }) async {
    final result = await _authApi.login(email: email, password: password);
    await result.fold(
      (_) async {},
      (tokens) async => _tokenManager.saveTokens(
        access: tokens.accessToken,
        refresh: tokens.accessToken,
        expiry: DateTime.now().add(const Duration(days: 7)),
      ),
    );
    return result;
  }

  @override
  Future<Either<NetworkError, AuthTokens>> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final result = await _authApi.register(
      email: email,
      password: password,
      fullName: fullName,
    );
    await result.fold(
      (_) async {},
      (tokens) async => _tokenManager.saveTokens(
        access: tokens.accessToken,
        refresh: tokens.accessToken,
        expiry: DateTime.now().add(const Duration(days: 7)),
      ),
    );
    return result;
  }

  @override
  Future<Either<NetworkError, AuthUser>> getMe() => _authApi.getMe();

  @override
  Future<void> logout() => _tokenManager.clearTokens();

  @override
  Future<bool> get isLoggedIn async {
    final token = await _tokenManager.accessToken;
    return token != null && token.isNotEmpty;
  }
}
