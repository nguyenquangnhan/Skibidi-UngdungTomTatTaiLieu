import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error.dart';
import '../../../../core/network/api.dart';
import '../../../../core/network/dio.dart';
import '../../domain/models/auth_user.dart';

abstract interface class AuthApi {
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
}

@LazySingleton(as: AuthApi)
final class AuthApiImpl extends Api implements AuthApi {
  const AuthApiImpl(@nonAuthDio super.dio);

  @override
  Future<Either<NetworkError, AuthTokens>> login({
    required String email,
    required String password,
  }) =>
      withTimeoutRequest(() async {
        final response = await dio.post<Map<String, dynamic>>(
          '/api/auth/login',
          data: {'username': email, 'password': password},
          options: Options(
            contentType: 'application/x-www-form-urlencoded',
          ),
        );
        return AuthTokens.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, AuthTokens>> register({
    required String email,
    required String password,
    required String fullName,
  }) =>
      withTimeoutRequest(() async {
        final response = await dio.post<Map<String, dynamic>>(
          '/api/auth/register',
          data: {
            'email': email,
            'password': password,
            'full_name': fullName,
          },
        );
        return AuthTokens.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, AuthUser>> getMe() =>
      withTimeoutRequest(() async {
        final response =
            await dio.get<Map<String, dynamic>>('/api/auth/me');
        return AuthUser.fromJson(response.data!);
      });
}
