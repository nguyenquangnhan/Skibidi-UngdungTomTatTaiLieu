import 'package:injectable/injectable.dart';
import 'package:signals/signals.dart';

import '../../auth/domain/models/auth_user.dart';
import '../../auth/presentation/auth_view_model.dart';
import '../domain/models/notebook.dart';
import '../data/sources/notebook_api.dart';

@injectable
final class NotebooksViewModel {
  NotebooksViewModel(this._notebookApi, this._authViewModel);

  final NotebookApi _notebookApi;
  final AuthViewModel _authViewModel;

  final _notebooks = signal<AsyncState<List<Notebook>>?>(null);
  final _isCreating = signal<bool>(false);
  final _isDeleting = signal<Set<String>>({});

  ReadonlySignal<AsyncState<List<Notebook>>?> get notebooks => _notebooks;
  ReadonlySignal<bool> get isCreating => _isCreating;
  ReadonlySignal<Set<String>> get isDeleting => _isDeleting;
  ReadonlySignal<AuthUser?> get currentUser => _authViewModel.currentUser;

  Future<void> loadNotebooks() async {
    if (_notebooks.value is AsyncLoading<List<Notebook>>) return;
    _notebooks.value = AsyncState.loading();
    final result = await _notebookApi.getNotebooks();
    result.fold(
      (err) => _notebooks.value = AsyncState.error(err),
      (list) => _notebooks.value = AsyncState.data(list),
    );
  }

  Future<Notebook?> createNotebook({
    required String title,
    String? description,
  }) async {
    _isCreating.value = true;
    final result = await _notebookApi.createNotebook(
        title: title, description: description);
    _isCreating.value = false;
    return result.fold(
      (_) => null,
      (nb) {
        final current = _notebooks.value;
        if (current is AsyncData<List<Notebook>>) {
          _notebooks.value = AsyncState.data([nb, ...current.value]);
        }
        return nb;
      },
    );
  }

  Future<bool> deleteNotebook(String id) async {
    _isDeleting.value = {..._isDeleting.value, id};
    final result = await _notebookApi.deleteNotebook(id);
    _isDeleting.value = {..._isDeleting.value}..remove(id);
    return result.fold(
      (_) => false,
      (_) {
        final current = _notebooks.value;
        if (current is AsyncData<List<Notebook>>) {
          _notebooks.value = AsyncState.data(
            current.value.where((nb) => nb.id != id).toList(),
          );
        }
        return true;
      },
    );
  }

  Future<void> logout() => _authViewModel.logout();
}
