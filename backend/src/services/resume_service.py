import fitz  # PyMuPDF
import os
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class ResumeStructure(BaseModel):
    skills: List[str] = Field(description="List of technical skills extracted from the resume")
    experience: List[Dict[str, Any]] = Field(description="Work experience including role, company, and description")
    education: List[Dict[str, Any]] = Field(description="Education history including degree and institution")
    summary: str = Field(description="A brief professional summary extracted from the resume")
    projects: List[Dict[str, Any]] = Field(description="Personal or professional projects")

class ResumeService:
    def __init__(self, model_name: str = "gpt-4o"):
        self.model_name = model_name
        if "gpt" in model_name:
            self.llm = ChatOpenAI(model=model_name, temperature=0)
        else:
            self.llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
        
        self.parser = JsonOutputParser(pydantic_object=ResumeStructure)
        self.prompt = ChatPromptTemplate.from_template(
            "Extract structured information from the following resume text:\n\n{resume_text}\n\n{format_instructions}"
        ).partial(format_instructions=self.parser.get_format_instructions())

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    async def parse_resume(self, text: str) -> Dict[str, Any]:
        chain = self.prompt | self.llm | self.parser
        result = await chain.ainvoke({"resume_text": text})
        return result

    def calculate_resume_score(self, structured_data: Dict[str, Any]) -> int:
        # Simple scoring logic
        score = 0
        if structured_data.get("skills"): score += 30
        if structured_data.get("experience"): score += 40
        if structured_data.get("education"): score += 20
        if structured_data.get("projects"): score += 10
        return min(score, 100)
