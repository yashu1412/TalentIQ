import httpx
import time
import logging
import json
from typing import List, Dict

log = logging.getLogger(__name__)

class AIHandler:
    def __init__(self, config: Dict):
        self.provider = config.get('provider', 'openrouter')
        self.cache = {}

        if self.provider == 'openrouter':
            self.api_key  = config.get('openrouter_api_key') or config.get('api_key')
            self.model    = config.get('openrouter_default_model', 'google/gemma-4-31b-it:free')
            self.base_url = config.get('openrouter_base_url', 'https://openrouter.ai/api/v1')
            self._extra_headers = {
                "HTTP-Referer": "https://github.com/yashu1412/TaltRoom-AI",
                "X-Title":      "TalentIQ Auto Job Bot",
            }
        elif self.provider == 'gemini':
            self.api_key  = config.get('api_key')
            self.model    = config.get('model', 'gemini-2.0-flash')
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
            self._extra_headers = {}
        else:  # openai
            self.api_key  = config.get('api_key')
            self.model    = config.get('model', 'gpt-4o-mini')
            self.base_url = "https://api.openai.com/v1"
            self._extra_headers = {}

        self.client = httpx.Client(timeout=30.0)

    def ask(self, question: str, job_context: Dict) -> str:
        cache_key = f"{question}_{job_context.get('job_title')}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        prompt = f"""
        Question: {question}
        Job Title: {job_context.get('job_title')}
        Company: {job_context.get('company')}
        My Resume Summary: {job_context.get('resume_summary')}
        
        Provide a short, professional, human-like answer (max 2 sentences).
        Answer:
        """

        messages = [
            {"role": "system", "content": "You are a professional job applicant. Answer questions truthfully and concisely based on the provided resume context."},
            {"role": "user", "content": prompt}
        ]

        return self._chat(messages, cache_key)

    def tailor_resume(self, job_description: str, resume_data: Dict) -> str:
        log.info("Tailoring resume summary for job description...")
        prompt = f"""
        Job Description: {job_description}
        My Resume Data: {json.dumps(resume_data)}
        
        Task: Re-write my professional summary to highlight the most relevant skills for this specific job.
        
        CRITICAL CONSTRAINTS:
        1. Word Limit: Maximum 50 words.
        2. Format: A single, cohesive paragraph.
        3. Output: Return ONLY the new summary text. No preamble, no quotes.
        """
        messages = [{"role": "user", "content": prompt}]
        return self._chat(messages)

    def generate_cover_letter(self, job_description: str, resume_data: Dict, company_name: str, job_title: str) -> str:
        log.info(f"Generating cover letter for {job_title} at {company_name}...")
        prompt = f"""
        Job Description: {job_description}
        Company: {company_name}
        Job Title: {job_title}
        My Resume Data: {json.dumps(resume_data)}
        
        Task: Write a professional, concise cover letter for this role (under 250 words).
        Output ONLY the cover letter text, ready to be pasted or saved.
        """
        messages = [{"role": "user", "content": prompt}]
        return self._chat(messages)

    def get_ats_score(self, job_description: str, resume_data: Dict) -> int:
        log.info("Simulating ATS scoring...")
        prompt = f"""
        Job Description: {job_description}
        My Resume Data: {json.dumps(resume_data)}
        
        Task: Score my resume compatibility for this job from 0-100.
        Consider keyword density and required vs provided skills.
        Return ONLY the numeric score.
        """
        messages = [{"role": "user", "content": prompt}]
        try:
            score_str = self._chat(messages)
            return int(''.join(filter(str.isdigit, score_str)))
        except:
            return 50

    def _chat(self, messages, cache_key=None):
        retries = 3
        for i in range(retries):
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type":  "application/json",
                    **self._extra_headers,
                }
                response = self.client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model":       self.model,
                        "messages":    messages,
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 429:
                    wait_time = (i + 1) * 10
                    log.warning(f"Rate limited (429). Waiting {wait_time}s before retry {i+1}/{retries}...")
                    time.sleep(wait_time)
                    continue

                response.raise_for_status()
                answer = response.json()['choices'][0]['message']['content'].strip()
                if cache_key:
                    self.cache[cache_key] = answer
                return answer
            except Exception as e:
                if i == retries - 1:
                    log.error(f"AI API Final Error: {e}")
                    return "50" if "score" in str(messages) else "Professional and ready to contribute."
                time.sleep(2)
        return "Professional and ready."

    def close(self):
        self.client.close()
