import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/resume_repository.dart';

// ─── State ───────────────────────────────────────────────────────────────────

enum ResumeStatus { initial, picking, uploading, success, error }

class ResumeState {
  final ResumeStatus status;
  final Map<String, dynamic>? resume;
  final List<Map<String, dynamic>> resumes;
  final String? error;

  const ResumeState({
    this.status = ResumeStatus.initial,
    this.resume,
    this.resumes = const [],
    this.error,
  });

  ResumeState copyWith({
    ResumeStatus? status,
    Map<String, dynamic>? resume,
    List<Map<String, dynamic>>? resumes,
    String? error,
    bool clearError = false,
    bool clearResume = false,
  }) {
    return ResumeState(
      status: status ?? this.status,
      resume: clearResume ? null : (resume ?? this.resume),
      resumes: resumes ?? this.resumes,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

// ─── Controller ──────────────────────────────────────────────────────────────

final resumeControllerProvider =
    StateNotifierProvider<ResumeController, ResumeState>(
  (ref) => ResumeController(ref.read(resumeRepositoryProvider)),
);

class ResumeController extends StateNotifier<ResumeState> {
  final ResumeRepository _repo;
  ResumeController(this._repo) : super(const ResumeState()) {
    loadResumes();
  }

  Future<void> loadResumes() async {
    try {
      final resumes = await _repo.listResumes();
      final latest = resumes.isNotEmpty ? resumes.first : null;
      state = state.copyWith(resumes: resumes, resume: latest, status: ResumeStatus.initial, clearError: true);
    } catch (e) {
      // Not fatal — just show empty state
    }
  }

  Future<void> pickAndUpload() async {
    state = state.copyWith(status: ResumeStatus.picking, clearError: true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: false,
        withData: kIsWeb, // On web we need bytes; on native we use path
      );
      if (result == null || result.files.isEmpty) {
        state = state.copyWith(status: ResumeStatus.initial);
        return;
      }

      final pickedFile = result.files.single;
      state = state.copyWith(status: ResumeStatus.uploading);

      Map<String, dynamic> uploaded;
      if (kIsWeb) {
        // Web: use bytes (path is always null in browser)
        final bytes = pickedFile.bytes;
        if (bytes == null) {
          state = state.copyWith(status: ResumeStatus.error, error: 'Could not read file bytes');
          return;
        }
        uploaded = await _repo.uploadResume(
          null,
          bytes: bytes,
          fileName: pickedFile.name,
        );
      } else {
        // Native (Android/iOS): use file path
        final path = pickedFile.path;
        if (path == null) {
          state = state.copyWith(status: ResumeStatus.error, error: 'Could not read file path');
          return;
        }
        uploaded = await _repo.uploadResume(path);
      }

      await loadResumes();
      state = state.copyWith(status: ResumeStatus.success, resume: uploaded);
    } catch (e) {
      state = state.copyWith(status: ResumeStatus.error, error: e.toString());
    }
  }
}
