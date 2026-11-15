import 'package:freezed_annotation/freezed_annotation.dart';

part 'document_source.freezed.dart';
part 'document_source.g.dart';

enum SourceType {
  pdf,
  image,
  url,
  text,
}

enum SourceStatus {
  pending,
  processing,
  ready,
  failed,
}

@freezed
abstract class DocumentSource with _$DocumentSource {
  const factory DocumentSource({
    required String id,
    required String notebookId,
    required String title,
    required SourceType sourceType,
    required SourceStatus status,
    String? url,
    String? filePath,
    required DateTime createdAt,
  }) = _DocumentSource;

  factory DocumentSource.fromJson(Map<String, dynamic> json) =>
      _$DocumentSourceFromJson(json);
}
