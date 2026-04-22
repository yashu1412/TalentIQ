from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from src.core.openrouter_client import get_langchain_chat_model


class JobAnalysis(BaseModel):
    title: str = Field(description="Extracted job title")
    company: str = Field(description="Extracted company name")
    required_skills: List[str] = Field(
        description="Must-have skills required for the role"
    )
    preferred_skills: List[str] = Field(
        description="Nice-to-have skills for the role"
    )
    experience_level: str = Field(
        description="Years of experience or seniority level required"
    )
    summary: str = Field(
        description="Brief overview of the role and responsibilities"
    )


class JobService:
    def __init__(self, model_name: str | None = None):
        """
        Initialize the Job Analysis service using OpenRouter as the LLM gateway.

        Parameters
        ----------
        model_name : OpenRouter model ID, e.g. "openai/gpt-4o".
                     Falls back to OPENROUTER_DEFAULT_MODEL env var.
        """
        self.llm = get_langchain_chat_model(model=model_name, temperature=0)
        self.parser = JsonOutputParser(pydantic_object=JobAnalysis)
        self.prompt = ChatPromptTemplate.from_template(
            "Analyze the following job description and extract structured "
            "information:\n\n{jd_text}\n\n{format_instructions}"
        ).partial(format_instructions=self.parser.get_format_instructions())

    async def analyze_jd(self, jd_text: str) -> Dict[str, Any]:
        chain = self.prompt | self.llm | self.parser
        result = await chain.ainvoke({"jd_text": jd_text})
        return result

    def calculate_ats_match(
        self, resume_skills: List[str], job_skills: List[str]
    ) -> Dict[str, Any]:
        matched_skills = [
            skill
            for skill in resume_skills
            if skill.lower() in [s.lower() for s in job_skills]
        ]
        missing_skills = [
            skill
            for skill in job_skills
            if skill.lower() not in [s.lower() for s in resume_skills]
        ]

        match_score = (
            (len(matched_skills) / len(job_skills) * 100) if job_skills else 0
        )

        return {
            "match_score": round(match_score, 2),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
        }
