import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:injectable/injectable.dart';
import 'package:signals/signals.dart';

import '../domain/models/chat_message.dart';
import '../domain/models/document_source.dart';
import '../data/sources/notebook_detail_api.dart';

@injectable
final class NotebookDetailViewModel {
  NotebookDetailViewModel(this._api);

  final NotebookDetailApi _api;

  String _notebookId = '';

  final _sources = signal<AsyncState<List<DocumentSource>>?>(null);
  final _messages = signal<List<ChatMessage>>([]);
  final _streamingMessage = signal<String>('');
  final _isStreaming = signal<bool>(false);
  final _isUploading = signal<bool>(false);
  final _isAddingUrl = signal<bool>(false);

  ReadonlySignal<AsyncState<List<DocumentSource>>?> get sources => _sources;
  ReadonlySignal<List<ChatMessage>> get messages => _messages;
  ReadonlySignal<String> get streamingMessage => _streamingMessage;
  ReadonlySignal<bool> get isStreaming => _isStreaming;
  ReadonlySignal<bool> get isUploading => _isUploading;
  ReadonlySignal<bool> get isAddingUrl => _isAddingUrl;

  void init(String notebookId) {
    _notebookId = notebookId;
    loadSources();
    loadChatHistory();
  }

  Future<void> loadSources() async {
    if (_sources.value is AsyncLoading<List<DocumentSource>>) return;
    _sources.value = AsyncState.loading();
    final result = await _api.getSources(_notebookId);
    result.fold(
      (err) => _sources.value = AsyncState.error(err),
      (list) => _sources.value = AsyncState.data(list),
    );
  }

  Future<void> loadChatHistory() async {
    final result = await _api.getChatHistory(_notebookId);
    result.fold(
      (_) {},
      (msgs) => _messages.value = msgs,
    );
  }

  Future<bool> pickAndUploadFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    );
    if (result == null || result.files.isEmpty) return false;

    _isUploading.value = true;
    final file = result.files.first;
    final multipart = await MultipartFile.fromFile(
      file.path!,
      filename: file.name,
    );

    final apiResult = await _api.uploadFile(
      notebookId: _notebookId,
      file: multipart,
    );
    _isUploading.value = false;

    return apiResult.fold(
      (_) => false,
      (source) {
        final current = _sources.value;
        if (current is AsyncData<List<DocumentSource>>) {
          _sources.value = AsyncState.data([source, ...current.value]);
        }
        return true;
      },
    );
  }

  Future<bool> addUrl(String url) async {
    _isAddingUrl.value = true;
    final result = await _api.addUrl(notebookId: _notebookId, url: url);
    _isAddingUrl.value = false;
    return result.fold(
      (_) => false,
      (source) {
        final current = _sources.value;
        if (current is AsyncData<List<DocumentSource>>) {
          _sources.value = AsyncState.data([source, ...current.value]);
        }
        return true;
      },
    );
  }

  Future<bool> deleteSource(String sourceId) async {
    final result =
        await _api.deleteSource(notebookId: _notebookId, sourceId: sourceId);
    return result.fold(
      (_) => false,
      (_) {
        final current = _sources.value;
        if (current is AsyncData<List<DocumentSource>>) {
          _sources.value = AsyncState.data(
            current.value.where((s) => s.id != sourceId).toList(),
          );
        }
        return true;
      },
    );
  }

  Future<void> sendMessage(String message) async {
    if (_isStreaming.value || message.trim().isEmpty) return;

    // Add user message optimistically
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      notebookId: _notebookId,
      role: ChatRole.user,
      content: message.trim(),
      createdAt: DateTime.now(),
    );
    _messages.value = [..._messages.value, userMsg];

    _isStreaming.value = true;
    _streamingMessage.value = '';

    final buffer = StringBuffer();
    try {
      await for (final chunk
          in _api.chatStream(notebookId: _notebookId, message: message)) {
        // Parse SSE format "data: {...}\n\n"
        final lines = chunk.split('\n');
        for (final line in lines) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6);
            try {
              // Try to parse JSON
              // If it's plain text streaming, just append
              if (!data.startsWith('{')) {
                buffer.write(data);
                _streamingMessage.value = buffer.toString();
              }
            } catch (_) {
              buffer.write(data);
              _streamingMessage.value = buffer.toString();
            }
          }
        }
      }
    } catch (_) {}

    // Finalize: add assistant message
    if (buffer.isNotEmpty) {
      final assistantMsg = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        notebookId: _notebookId,
        role: ChatRole.assistant,
        content: buffer.toString(),
        createdAt: DateTime.now(),
      );
      _messages.value = [..._messages.value, assistantMsg];
    }

    _streamingMessage.value = '';
    _isStreaming.value = false;
  }
}
