import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../error_screen.dart';
import '../di/get_it.dart';
import '../../features/auth/presentation/auth_view_model.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/notebooks/presentation/notebooks_screen.dart';
import '../../features/notebooks/presentation/notebooks_view_model.dart';
import '../../features/notebook_detail/presentation/notebook_detail_screen.dart';
import '../../features/notebook_detail/presentation/notebook_detail_view_model.dart';

abstract class AppRouter {
  AppRouter._();

  static final _authViewModel = getIt<AuthViewModel>();

  static final routerConfig = GoRouter(
    debugLogDiagnostics: true,
    initialLocation: '/login',
    redirect: (context, state) async {
      final isLoggedIn = await _authViewModel.isLoggedIn();
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/notebooks';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => LoginScreen(viewModel: getIt<AuthViewModel>()),
      ),
      GoRoute(
        path: '/register',
        builder: (_, __) =>
            RegisterScreen(viewModel: getIt<AuthViewModel>()),
      ),
      GoRoute(
        path: '/notebooks',
        builder: (_, __) => NotebooksScreen(
          viewModel: getIt<NotebooksViewModel>(),
        ),
        routes: [
          GoRoute(
            path: ':id',
            builder: (_, state) {
              final notebookId = state.pathParameters['id']!;
              final notebookTitle =
                  state.uri.queryParameters['title'] ?? 'Notebook';
              return NotebookDetailScreen(
                notebookId: notebookId,
                notebookTitle: notebookTitle,
                viewModel: getIt<NotebookDetailViewModel>(),
              );
            },
          ),
        ],
      ),
    ],
    errorBuilder: (_, __) => const ErrorScreen(),
  );
}
