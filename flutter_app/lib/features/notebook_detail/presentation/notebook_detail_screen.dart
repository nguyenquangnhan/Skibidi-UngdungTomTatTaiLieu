import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:signals/signals_flutter.dart';

import '../domain/models/chat_message.dart';
import '../domain/models/document_source.dart';
import 'notebook_detail_view_model.dart';

class NotebookDetailScreen extends StatefulWidget {
  const NotebookDetailScreen({
    super.key,
    required this.notebookId,
    required this.notebookTitle,
    required this.viewModel,
  });

  final String notebookId;
  final String notebookTitle;
  final NotebookDetailViewModel viewModel;

  @override
  State<NotebookDetailScreen> createState() => _NotebookDetailScreenState();
}

class _NotebookDetailScreenState extends State<NotebookDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _chatCtrl = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    widget.viewModel.init(widget.notebookId);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _chatCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _showAddUrlDialog() async {
    final urlCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Thêm URL'),
        content: TextField(
          controller: urlCtrl,
          decoration: const InputDecoration(
            labelText: 'URL (https://...)',
            prefixIcon: Icon(Icons.link),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12))),
          ),
          keyboardType: TextInputType.url,
          autofocus: true,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Huỷ')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Thêm'),
          ),
        ],
      ),
    );

    if (result == true && urlCtrl.text.isNotEmpty) {
      final success = await widget.viewModel.addUrl(urlCtrl.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(success ? 'Đã thêm URL' : 'Không thể thêm URL'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _sendMessage() async {
    final msg = _chatCtrl.text.trim();
    if (msg.isEmpty) return;
    _chatCtrl.clear();
    _scrollToBottom();
    await widget.viewModel.sendMessage(msg);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.notebookTitle,
            overflow: TextOverflow.ellipsis, maxLines: 1),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.description_outlined), text: 'Nguồn tài liệu'),
            Tab(icon: Icon(Icons.chat_outlined), text: 'Hỏi đáp AI'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _SourcesTab(viewModel: widget.viewModel, onAddUrl: _showAddUrlDialog),
          _ChatTab(
            viewModel: widget.viewModel,
            chatCtrl: _chatCtrl,
            scrollController: _scrollController,
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}

// ── Sources Tab ──────────────────────────────────────────────────────────────

class _SourcesTab extends StatelessWidget {
  const _SourcesTab({required this.viewModel, required this.onAddUrl});

  final NotebookDetailViewModel viewModel;
  final VoidCallback onAddUrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildActions(context),
        Expanded(
          child: Watch((context) {
            final state = viewModel.sources.value;
            if (state == null || state is AsyncLoading<List<DocumentSource>>) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is AsyncError<List<DocumentSource>>) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48),
                    const SizedBox(height: 8),
                    const Text('Không thể tải nguồn tài liệu'),
                    TextButton(
                        onPressed: viewModel.loadSources,
                        child: const Text('Thử lại')),
                  ],
                ),
              );
            }
            final sources = (state as AsyncData<List<DocumentSource>>).value;
            if (sources.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.upload_file_outlined,
                        size: 64,
                        color: Theme.of(context)
                            .colorScheme
                            .primary
                            .withOpacity(0.4)),
                    const SizedBox(height: 16),
                    const Text('Chưa có tài liệu nào'),
                    const SizedBox(height: 8),
                    const Text(
                      'Upload PDF/ảnh hoặc thêm URL để bắt đầu',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }
            return RefreshIndicator(
              onRefresh: viewModel.loadSources,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: sources.length,
                itemBuilder: (ctx, i) => _SourceCard(
                  source: sources[i],
                  onDelete: () => viewModel.deleteSource(sources[i].id),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Watch((context) {
              final isUploading = viewModel.isUploading.value;
              return OutlinedButton.icon(
                onPressed: isUploading ? null : viewModel.pickAndUploadFile,
                icon: isUploading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.upload_file_outlined),
                label: Text(isUploading ? 'Đang upload...' : 'Upload file'),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12))),
              );
            }),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Watch((context) {
              final isAddingUrl = viewModel.isAddingUrl.value;
              return OutlinedButton.icon(
                onPressed: isAddingUrl ? null : onAddUrl,
                icon: isAddingUrl
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.link),
                label: Text(isAddingUrl ? 'Đang thêm...' : 'Thêm URL'),
                style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12))),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _SourceCard extends StatelessWidget {
  const _SourceCard({required this.source, required this.onDelete});

  final DocumentSource source;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final statusColor = switch (source.status) {
      SourceStatus.ready => Colors.green,
      SourceStatus.processing => Colors.orange,
      SourceStatus.pending => Colors.blue,
      SourceStatus.failed => colorScheme.error,
    };
    final statusText = switch (source.status) {
      SourceStatus.ready => 'Sẵn sàng',
      SourceStatus.processing => 'Đang xử lý...',
      SourceStatus.pending => 'Chờ xử lý',
      SourceStatus.failed => 'Thất bại',
    };
    final icon = switch (source.sourceType) {
      SourceType.pdf => Icons.picture_as_pdf_outlined,
      SourceType.image => Icons.image_outlined,
      SourceType.url => Icons.link,
      SourceType.text => Icons.text_snippet_outlined,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: colorScheme.primaryContainer,
          child: Icon(icon, color: colorScheme.onPrimaryContainer, size: 20),
        ),
        title: Text(source.title,
            maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                  color: statusColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 4),
            Text(statusText,
                style: TextStyle(color: statusColor, fontSize: 12)),
          ],
        ),
        trailing: IconButton(
          icon: Icon(Icons.delete_outline, color: colorScheme.error),
          onPressed: onDelete,
        ),
      ),
    );
  }
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────

class _ChatTab extends StatelessWidget {
  const _ChatTab({
    required this.viewModel,
    required this.chatCtrl,
    required this.scrollController,
    required this.onSend,
  });

  final NotebookDetailViewModel viewModel;
  final TextEditingController chatCtrl;
  final ScrollController scrollController;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Watch((context) {
            final messages = viewModel.messages.value;
            final streaming = viewModel.streamingMessage.value;

            if (messages.isEmpty && streaming.isEmpty) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.smart_toy_outlined,
                        size: 64,
                        color: Theme.of(context)
                            .colorScheme
                            .primary
                            .withOpacity(0.4)),
                    const SizedBox(height: 16),
                    const Text('Hỏi AI về tài liệu của bạn'),
                    const SizedBox(height: 8),
                    const Text(
                      'Hãy upload tài liệu trước, rồi đặt câu hỏi!',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              controller: scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length + (streaming.isNotEmpty ? 1 : 0),
              itemBuilder: (ctx, i) {
                if (i == messages.length && streaming.isNotEmpty) {
                  return _MessageBubble(
                    role: ChatRole.assistant,
                    content: streaming,
                    isStreaming: true,
                  );
                }
                final msg = messages[i];
                return _MessageBubble(
                  role: msg.role,
                  content: msg.content,
                  isStreaming: false,
                );
              },
            );
          }),
        ),
        _buildInputBar(context),
      ],
    );
  }

  Widget _buildInputBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: chatCtrl,
              decoration: InputDecoration(
                hintText: 'Hỏi AI về tài liệu...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
              ),
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: 8),
          Watch((context) {
            final isStreaming = viewModel.isStreaming.value;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              child: FilledButton(
                onPressed: isStreaming ? null : onSend,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(48, 48),
                  shape: const CircleBorder(),
                  padding: EdgeInsets.zero,
                ),
                child: isStreaming
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.role,
    required this.content,
    required this.isStreaming,
  });

  final ChatRole role;
  final String content;
  final bool isStreaming;

  @override
  Widget build(BuildContext context) {
    final isUser = role == ChatRole.user;
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: colorScheme.primaryContainer,
              child: Icon(Icons.smart_toy_rounded,
                  size: 16, color: colorScheme.onPrimaryContainer),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: GestureDetector(
              onLongPress: () {
                Clipboard.setData(ClipboardData(text: content));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Đã sao chép'),
                    behavior: SnackBarBehavior.floating,
                    duration: Duration(seconds: 1),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isUser
                      ? colorScheme.primary
                      : colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft:
                        Radius.circular(isUser ? 18 : 4),
                    bottomRight:
                        Radius.circular(isUser ? 4 : 18),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Flexible(
                      child: Text(
                        content,
                        style: TextStyle(
                          color: isUser
                              ? colorScheme.onPrimary
                              : colorScheme.onSurfaceVariant,
                          height: 1.5,
                        ),
                      ),
                    ),
                    if (isStreaming) ...[
                      const SizedBox(width: 6),
                      _BlinkingCursor(),
                    ],
                  ],
                ),
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: colorScheme.secondary,
              child: Icon(Icons.person_rounded,
                  size: 16, color: colorScheme.onSecondary),
            ),
          ],
        ],
      ),
    );
  }
}

class _BlinkingCursor extends StatefulWidget {
  @override
  State<_BlinkingCursor> createState() => _BlinkingCursorState();
}

class _BlinkingCursorState extends State<_BlinkingCursor>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0, end: 1).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 2,
        height: 16,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
  }
}
