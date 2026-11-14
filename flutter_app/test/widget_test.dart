import 'package:flutter/material.dart';
import 'package:flutter_agentic_starter/core/di/get_it.dart';
import 'package:flutter_agentic_starter/core/router/router.dart';
import 'package:flutter_agentic_starter/shared/i18n/generated/app_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  setUpAll(() {
    configureDependencies();
  });

  testWidgets('app router redirects unauthenticated user to login screen', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp.router(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        routerConfig: AppRouter.routerConfig,
      ),
    );
    await tester.pumpAndSettle();

    expect(
      AppRouter.routerConfig.routeInformationProvider.value.uri.path,
      '/login',
    );
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Mật khẩu'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsOneWidget);
  });
}
