from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

from src.core.openrouter_client import get_langchain_chat_model


class AICopilotService:
    def __init__(self, model_name: str | None = None, temperature: float = 0.7):
        """
        Initialize the AI Copilot service using OpenRouter as the LLM gateway.

        Parameters
        ----------
        model_name  : OpenRouter model ID, e.g. "openai/gpt-4o".
                      Falls back to OPENROUTER_DEFAULT_MODEL env var.
        temperature : Sampling temperature.
        """
        self.llm = get_langchain_chat_model(model=model_name, temperature=temperature)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )

    async def get_career_advice(
        self,
        user_query: str,
        resume_data: Dict[str, Any] | None = None,
        job_data: Dict[str, Any] | None = None,
    ) -> str:
        system_msg = "You are a Talent-IQ Career Copilot, an expert career advisor. "
        if resume_data:
            system_msg += f"The candidate's profile is: {resume_data}. "
        if job_data:
            system_msg += f"The job they are interested in is: {job_data}. "

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=system_msg),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessage(content=user_query),
        ])

        chain = prompt | self.llm
        result = await chain.ainvoke(
            {"chat_history": self.memory.chat_memory.messages}
        )

        self.memory.chat_memory.add_user_message(user_query)
        self.memory.chat_memory.add_ai_message(result.content)

        return result.content

    async def generate_cover_letter(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> str:
        prompt = ChatPromptTemplate.from_template(
            "Write a professional and compelling cover letter for the following "
            "candidate profile and job description:\n\n"
            "Candidate: {resume_data}\n\n"
            "Job: {job_data}\n\n"
            "The cover letter should highlight the candidate's relevant skills "
            "and achievements for this specific role."
        )

        chain = prompt | self.llm
        result = await chain.ainvoke(
            {"resume_data": resume_data, "job_data": job_data}
        )
        return result.content
