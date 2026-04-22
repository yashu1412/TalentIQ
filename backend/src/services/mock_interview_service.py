from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from src.core.openrouter_client import get_langchain_chat_model


class InterviewEvaluation(BaseModel):
    score: int = Field(description="Score from 0 to 100")
    feedback: str = Field(description="Detailed feedback on the candidate's response")
    strengths: List[str] = Field(description="Key strengths identified")
    areas_for_improvement: List[str] = Field(description="Specific areas to improve")
    sample_answer: str = Field(description="An example of a high-quality answer")


class MockInterviewService:
    def __init__(self, model_name: str | None = None, temperature: float = 0.7):
        """
        Initialize the Mock Interview service using OpenRouter as the LLM gateway.

        Parameters
        ----------
        model_name  : OpenRouter model ID, e.g. "openai/gpt-4o".
                      Falls back to OPENROUTER_DEFAULT_MODEL env var.
        temperature : Sampling temperature.
        """
        self.llm = get_langchain_chat_model(model=model_name, temperature=temperature)

    async def generate_interview_questions(
        self,
        role: str,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any] | None = None,
    ) -> List[str]:
        prompt = ChatPromptTemplate.from_template(
            "Generate 5 relevant interview questions for the role of {role} "
            "based on the following profile:\n\n"
            "Profile: {resume_data}\n\n"
            "Job Description (if any): {job_data}\n\n"
            "Provide only the list of questions, one per line."
        )

        chain = prompt | self.llm
        result = await chain.ainvoke(
            {"role": role, "resume_data": resume_data, "job_data": job_data}
        )
        questions = [q.strip() for q in result.content.split("\n") if q.strip()]
        return questions[:5]

    async def evaluate_answer(
        self, question: str, answer: str, role: str
    ) -> Dict[str, Any]:
        parser = JsonOutputParser(pydantic_object=InterviewEvaluation)
        prompt = ChatPromptTemplate.from_template(
            "Evaluate the following answer to an interview question for the "
            "role of {role}:\n\n"
            "Question: {question}\n"
            "Answer: {answer}\n\n"
            "{format_instructions}"
        ).partial(format_instructions=parser.get_format_instructions())

        chain = prompt | self.llm | parser
        result = await chain.ainvoke(
            {"question": question, "answer": answer, "role": role}
        )
        return result
