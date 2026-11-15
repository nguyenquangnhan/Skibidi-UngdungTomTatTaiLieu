import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/error.dart';
import '../../../../core/network/api.dart';
import '../../../../core/network/dio.dart';
import '../../domain/models/document_source.dart';
import '../../domain/models/chat_message.dart';

abstract interface class NotebookDetailApi {
  Future<Either<NetworkError, List<DocumentSource>>> getSources(
      String notebookId);
  Future<Either<NetworkError, DocumentSource>> uploadFile({
    required String notebookId,
    required MultipartFile file,
  });
  Future<Either<NetworkError, DocumentSource>> addUrl({
    required String notebookId,
    required String url,
    String? title,
  });
  Future<Either<NetworkError, Unit>> deleteSource({
    required String notebookId,
    required String sourceId,
  });
  Future<Either<NetworkError, List<ChatMessage>>> getChatHistory(
      String notebookId);
  Stream<String> chatStream({
    required String notebookId,
    required String message,
  });
}

@LazySingleton(as: NotebookDetailApi)
final class NotebookDetailApiImpl extends Api implements NotebookDetailApi {
  const NotebookDetailApiImpl(@authDio super.dio);

  @override
  Future<Either<NetworkError, List<DocumentSource>>> getSources(
          String notebookId) =>
      withTimeoutRequest(() async {
        final response = await dio.get<List<dynamic>>(
            '/api/notebooks/$notebookId/sources');
        return (response.data as List<dynamic>)
            .map((e) =>
                DocumentSource.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  @override
  Future<Either<NetworkError, DocumentSource>> uploadFile({
    required String notebookId,
    required MultipartFile file,
  }) =>
      withTimeoutRequest(() async {
        final formData = FormData.fromMap({'file': file});
        final response = await dio.post<Map<String, dynamic>>(
          '/api/notebooks/$notebookId/sources/upload',
          data: formData,
        );
        return DocumentSource.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, DocumentSource>> addUrl({
    required String notebookId,
    required String url,
    String? title,
  }) =>
      withTimeoutRequest(() async {
        final response = await dio.post<Map<String, dynamic>>(
          '/api/notebooks/$notebookId/sources/url',
          data: {'url': url, 'title': title ?? url},
        );
        return DocumentSource.fromJson(response.data!);
      });

  @override
  Future<Either<NetworkError, Unit>> deleteSource({
    required String notebookId,
    required String sourceId,
  }) =>
      withTimeoutRequest(() async {
        await dio.delete(
            '/api/notebooks/$notebookId/sources/$sourceId');
        return unit;
      });

  @override
  Future<Either<NetworkError, List<ChatMessage>>> getChatHistory(
          String notebookId) =>
      withTimeoutRequest(() async {
        final response = await dio.get<List<dynamic>>(
            '/api/notebooks/$notebookId/chat');
        return (response.data as List<dynamic>)
            .map(
                (e) => ChatMessage.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  @override
  Stream<String> chatStream({
    required String notebookId,
    required String message,
  }) async* {
    final response = await dio.post<ResponseBody>(
      '/api/notebooks/$notebookId/chat',
      data: {'message': message},
      options: Options(responseType: ResponseType.stream),
    );

    await for (final chunk in response.data!.stream) {
      final text = String.fromCharCodes(chunk);
      yield text;
    }
  }
}
