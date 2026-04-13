import httpx
from typing import Dict, Any, List

class CodeExecutionService:
    def __init__(self, base_url: str = "https://emkc.org/api/v2/piston"):
        self.base_url = base_url

    async def execute_code(self, language: str, version: str, files: List[Dict[str, str]], stdin: str = "") -> Dict[str, Any]:
        url = f"{self.base_url}/execute"
        payload = {
            "language": language,
            "version": version,
            "files": files,
            "stdin": stdin
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                return {"error": f"Execution failed with status code {response.status_code}"}
            return response.json()

    async def get_runtimes(self) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/runtimes"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                return []
            return response.json()
