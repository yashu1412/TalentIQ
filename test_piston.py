
import asyncio
import httpx

async def test_piston():
    url = "https://emkc.org/api/v2/piston/execute"
    payload = {
        "language": "python",
        "version": "3.10.0",
        "files": [{"content": "print('hello from piston')"}],
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_piston())
