import 'package:freezed_annotation/freezed_annotation.dart';

part 'notebook.freezed.dart';
part 'notebook.g.dart';

@freezed
abstract class Notebook with _$Notebook {
  const factory Notebook({
    required String id,
    required String title,
    String? description,
    required String userId,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Notebook;

  factory Notebook.fromJson(Map<String, dynamic> json) =>
      _$NotebookFromJson(json);
}
