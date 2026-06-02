import json
import os
from datetime import datetime

class DedupManager:
    def __init__(self, storage_path):
        self.storage_path = storage_path
        self.applied_jobs = self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        return []

    def is_applied(self, job_id):
        return any(job['id'] == job_id for job in self.applied_jobs)

    def is_new(self, job_id):
        return not self.is_applied(job_id)

    def get_daily_count(self):
        today = datetime.now().date().isoformat()
        return len([j for j in self.applied_jobs if j['applied_at'].startswith(today) and j['status'] == 'Submitted'])

    def mark_applied(self, job_id, platform, status, details=None):
        details = details or {}
        entry = {
            "id": job_id,
            "platform": platform,
            "status": status,
            "applied_at": datetime.now().isoformat(),
            "company": details.get("company", ""),
            "title": details.get("title", ""),
            "resume_used": details.get("resume_used", ""),
            "cover_letter_used": details.get("cover_letter_used", ""),
            "external_url": details.get("external_url", ""),
            "location": details.get("location", {})
        }
        self.applied_jobs.append(entry)
        self._save()

    def _save(self):
        with open(self.storage_path, 'w') as f:
            json.dump(self.applied_jobs, f, indent=2)
