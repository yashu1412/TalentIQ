"""
LLM Client
==========
Provider priority:
  1. Google Gemini via `google-genai` SDK (async-native, current) -- if GOOGLE_API_KEY is set.
  2. OpenRouter (OpenAI-compatible) -- if OPENROUTER_API_KEY is set.

All routers use:
  - `llm_create(messages, max_tokens)` for regular calls
  - `get_openrouter_client()` for SSE streaming (copilot chat)
  - `OR_DEFAULT_MODEL` is always set to the active provider's best model.
"""
import os
import asyncio
import logging
import openai
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# ── Google Gemini (google-genai SDK) ──────────────────────────────────────────
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

# Try each model in order when rate-limited
GEMINI_MODELS: list[str] = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-2.0-flash",
]
GEMINI_DEFAULT_MODEL: str = GEMINI_MODELS[0]

# ── OpenRouter fallback ───────────────────────────────────────────────────────
OR_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OR_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OR_OPENROUTER_MODEL: str = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

# ── Active provider ───────────────────────────────────────────────────────────
_USE_GEMINI = False  # Hardcoded to disable Gemini and force OpenRouter fallback
OR_DEFAULT_MODEL: str = GEMINI_DEFAULT_MODEL if _USE_GEMINI else OR_OPENROUTER_MODEL
_ACTIVE_API_KEY: str = GOOGLE_API_KEY if _USE_GEMINI else OR_API_KEY
_ACTIVE_BASE_URL: str = GEMINI_BASE_URL if _USE_GEMINI else OR_BASE_URL
_ACTIVE_HEADERS: dict = {} if _USE_GEMINI else {
    "HTTP-Referer": "https://talentiq.app",
    "X-Title": "TalentIQ",
}
OR_HEADERS: dict = _ACTIVE_HEADERS

# ── google-genai async client ─────────────────────────────────────────────────
_genai_client = None
if _USE_GEMINI:
    try:
        from google import genai as _genai_lib
        _genai_client = _genai_lib.Client(api_key=GOOGLE_API_KEY)
    except ImportError:
        logger.warning("google-genai not installed; using OpenAI-compat endpoint.")

if not _ACTIVE_API_KEY:
    import warnings
    warnings.warn(
        "Neither GOOGLE_API_KEY nor OPENROUTER_API_KEY is set. LLM features will fail.",
        RuntimeWarning, stacklevel=2,
    )
else:
    provider = (
        "Google Gemini (google-genai SDK)" if (_USE_GEMINI and _genai_client)
        else ("Google Gemini (OpenAI-compat)" if _USE_GEMINI else "OpenRouter")
    )
    logger.info("LLM provider: %s (model: %s)", provider, OR_DEFAULT_MODEL)


# ── OpenAI-compat client (streaming / langchain only) ────────────────────────
@lru_cache(maxsize=1)
def get_openrouter_sync_client() -> openai.OpenAI:
    return openai.OpenAI(
        api_key=_ACTIVE_API_KEY,
        base_url=_ACTIVE_BASE_URL,
        default_headers=_ACTIVE_HEADERS,
    )


def get_openrouter_client() -> openai.AsyncOpenAI:
    """Async OpenAI-compat client — used for SSE streaming."""
    return openai.AsyncOpenAI(
        api_key=_ACTIVE_API_KEY,
        base_url=_ACTIVE_BASE_URL,
        default_headers=_ACTIVE_HEADERS,
    )


# ── Unified response wrapper ──────────────────────────────────────────────────
class _SimpleResponse:
    """Mimics openai.ChatCompletion so all routes stay the same."""
    class _Choice:
        class _Message:
            def __init__(self, content: str):
                self.content = content
        def __init__(self, content: str):
            self.message = self._Message(content)

    def __init__(self, content: str):
        self.choices = [self._Choice(content)]


# ── Main entry point ──────────────────────────────────────────────────────────
_RETRYABLE = {"ResourceExhausted", "ServiceUnavailable", "InternalServerError"}
_RETRYABLE_CODES = {429, 500, 502, 503, 504}


async def llm_create(
    messages: list[dict],
    model: str | None = None,
    max_tokens: int = 1000,
    stream: bool = False,
    **kwargs,
) -> _SimpleResponse:
    """
    Call the LLM with automatic retry and model fallback.

    Returns a `_SimpleResponse` with:
        resp.choices[0].message.content  -- the text

    Uses google-genai async SDK when available (better free-tier quotas).
    Falls back to OpenAI-compat on failure.
    """
    if _genai_client and not stream:
        try:
            return await _gemini_genai_create(messages, model, max_tokens, **kwargs)
        except Exception as exc:
            logger.warning("All Gemini native models failed (%s), trying OpenAI-compat", exc)

    return await _openai_compat_create(messages, model or OR_DEFAULT_MODEL, max_tokens, stream, **kwargs)


async def _gemini_genai_create(
    messages: list[dict],
    model: str | None,
    max_tokens: int,
    **kwargs,
) -> _SimpleResponse:
    """Call google-genai async SDK with model fallback + retry."""
    from google.genai import types as genai_types

    models_to_try = list(GEMINI_MODELS)
    if model and model not in models_to_try:
        models_to_try.insert(0, model)

    last_exc: Exception | None = None
    for m in models_to_try:
        for attempt in range(3):
            try:
                # Build contents and system instruction
                system_parts = [msg["content"] for msg in messages if msg["role"] == "system"]
                user_parts = [
                    {"role": "user" if msg["role"] == "user" else "model", "parts": [{"text": msg["content"]}]}
                    for msg in messages if msg["role"] in ("user", "assistant")
                ]
                # Last user message is the actual prompt
                prompt = next(
                    (msg["content"] for msg in reversed(messages) if msg["role"] == "user"), ""
                )

                config = genai_types.GenerateContentConfig(
                    max_output_tokens=max_tokens,
                    temperature=kwargs.get("temperature", 0.7),
                    system_instruction="\n".join(system_parts) if system_parts else None,
                )
                response = await _genai_client.aio.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=config,
                )
                return _SimpleResponse(response.text)

            except Exception as exc:
                last_exc = exc
                exc_type = type(exc).__name__
                exc_str = str(exc)
                is_quota = any(k in exc_type for k in _RETRYABLE) or any(
                    k in exc_str.lower() for k in ["quota", "exhausted", "unavailable", "503", "429"]
                )
                if is_quota:
                    wait = 2 ** attempt  # 1s, 2s, 4s
                    logger.warning(
                        "Gemini %s on model=%s attempt=%d, retrying in %ds",
                        exc_type, m, attempt + 1, wait,
                    )
                    await asyncio.sleep(wait)
                else:
                    logger.warning("Gemini non-retryable error on model=%s: %s", m, exc)
                    break  # try next model immediately

        logger.warning("All retries for model=%s exhausted, trying next fallback", m)

    raise last_exc  # type: ignore[misc]


async def _openai_compat_create(
    messages: list[dict],
    model: str,
    max_tokens: int,
    stream: bool,
    **kwargs,
):
    """Call via OpenAI-compat endpoint (streaming or final fallback)."""
    client = get_openrouter_client()
    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            return await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                stream=stream,
                **kwargs,
            )
        except openai.APIStatusError as exc:
            last_exc = exc
            if exc.status_code in _RETRYABLE_CODES:
                wait = 3 ** attempt
                logger.warning("OpenAI-compat %d, retrying in %ds", exc.status_code, wait)
                await asyncio.sleep(wait)
            else:
                raise
        except Exception as exc:
            raise
    raise last_exc  # type: ignore[misc]


# ── LangChain helper ──────────────────────────────────────────────────────────
def get_langchain_chat_model(model=None, temperature=0.7, streaming=False):
    try:
        from langchain_openai import ChatOpenAI
    except ImportError as exc:
        raise ImportError("pip install langchain-openai") from exc
    return ChatOpenAI(
        model=model or OR_DEFAULT_MODEL,
        temperature=temperature,
        streaming=streaming,
        api_key=_ACTIVE_API_KEY,
        base_url=_ACTIVE_BASE_URL,
        default_headers=_ACTIVE_HEADERS,
    )
