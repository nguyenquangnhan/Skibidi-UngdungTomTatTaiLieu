import 'package:fpdart/fpdart.dart';

import '../../../../core/error.dart';
import '../models/auth_user.dart';

abstract interface class AuthRepository {
  Future<Either<NetworkError, AuthTokens>> login({
    required String email,
    required String password,
  });

  Future<Either<NetworkError, AuthTokens>> register({
    required String email,
    required String password,
    required String fullName,
  });

  Future<Either<NetworkError, AuthUser>> getMe();

  Future<void> logout();

  Future<bool> get isLoggedIn;
}
