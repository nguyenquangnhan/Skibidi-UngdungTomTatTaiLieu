import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error.dart';
import '../../../../core/network/api.dart';
import '../../../../core/network/dio.dart';
import '../../domain/models/notebook.dart';

abstract interface class NotebookApi {
  Future<Either<NetworkError, List<Notebook>>> getNotebooks();
  Future<Either<NetworkError, Notebook>> createNotebook({
    required String title,
    String? description,
  });
  Future<Either<NetworkError, Notebook>> updateNotebook({
    required String id,
    required String title,
    String? description,
  });
  Future<Either<NetworkError, Unit>> deleteNotebook(String id);
}

@LazySingleton(as: NotebookApi)
final class NotebookApiImpl extends Api implements NotebookApi {
  const NotebookApiImpl(@authDio super.dio);

  @override
  Future<Either<NetworkError, List<Notebook>>> getNotebooks() =>
      withTimeoutRequest(() async {
        final response = await dio.get<List<dynamic>>('/api/notebooks');
        return (response.data as List<dynamic>)
            .map((e) => Notebook.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  @override
  Future<Either<NetworkError, Notebook>> createNotebook({
    required String title,
    String? description,
  }) =>
      withTimeoutRequest(() async {
        final response = await dio.post<Map<String, dynamic>>(
          '/api/notebooks',
          data: {'title': title, 'description': description},
        );
        return Notebook.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, Notebook>> updateNotebook({
    required String id,
    required String title,
    String? description,
  }) =>
      withTimeoutRequest(() async {
        final response = await dio.put<Map<String, dynamic>>(
          '/api/notebooks/$id',
          data: {'title': title, 'description': description},
        );
        return Notebook.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, Unit>> deleteNotebook(String id) =>
      withTimeoutRequest(() async {
        await dio.delete('/api/notebooks/$id');
        return unit;
      });
}
