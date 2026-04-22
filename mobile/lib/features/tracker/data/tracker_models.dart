class ApplicationItem {
  final String id;
  final String? jobId;
  final String? title;
  final String? company;
  final String status;
  final String? nextStep;
  final DateTime? reminderAt;

  const ApplicationItem({
    required this.id,
    this.jobId,
    required this.status,
    this.title,
    this.company,
    this.nextStep,
    this.reminderAt,
  });

  factory ApplicationItem.fromJson(Map<String, dynamic> json) {
    final rawReminder = json['reminder_at'] as String?;
    return ApplicationItem(
      id: json['id'] as String,
      jobId: json['job_id'] as String?,
      status: (json['status'] ?? 'saved') as String,
      title: json['title'] as String?,
      company: json['company'] as String?,
      nextStep: json['next_step'] as String?,
      reminderAt: rawReminder == null ? null : DateTime.tryParse(rawReminder),
    );
  }
}
