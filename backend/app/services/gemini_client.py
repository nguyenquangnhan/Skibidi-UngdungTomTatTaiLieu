from google import genai

from app.config import get_settings

settings = get_settings()
_next_key_index = 0


def get_gemini_clients() -> list[genai.Client]:
    global _next_key_index
    keys = settings.gemini_api_key_list
    if not keys:
        raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_API_KEYS")

    start = _next_key_index % len(keys)
    _next_key_index = (start + 1) % len(keys)
    ordered_keys = keys[start:] + keys[:start]
    return [genai.Client(api_key=key) for key in ordered_keys]
