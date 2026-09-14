import logging
# pyrefly: ignore [missing-import]
import httpx

logger = logging.getLogger(__name__)
REQUEST_TIMEOUT = 10.0

def detect_provider(api_key: str) -> str | None:
    """Detect AI provider by API key prefix conventions."""
    if api_key and (api_key.startswith("AIza") or api_key.startswith("AQ.") or len(api_key) >= 15):
        return "gemini"
    return None

def test_api_key(provider: str, api_key: str) -> tuple[bool, str]:
    """Test API key live against Gemini provider. Never log or leak the raw key."""
    if provider != "gemini":
        return False, "Only Gemini (Google) API keys are supported for shelf analysis."
    
    try:
        resp = httpx.get(
            f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
            timeout=REQUEST_TIMEOUT,
        )
    except httpx.RequestError:
        logger.warning("Provider validation request failed for Gemini")
        return False, "Could not reach the Gemini API to validate the key"

    if resp.status_code == 200:
        return True, ""
    if resp.status_code in (400, 401, 403):
        return False, "The Gemini API key was rejected"
    return False, f"Provider returned an unexpected status ({resp.status_code})"
