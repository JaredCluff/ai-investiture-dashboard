import re

_MAX_LENGTH = 2000

_STRIP_PATTERNS = [
    r"system\s*:",
    r"IMPORTANT\s*:",
    r"ignore\s+(all\s+)?previous",
    r"you\s+are\s+now",
    r"<\|",
    r"\[INST\]",
    r"</?[a-z][a-z0-9]*(\s[^>]*)?>",  # HTML/XML tags
    r"https?://\S+",                    # URLs
    r"`{3}[\s\S]*?`{3}",               # Code blocks with triple backticks
]
_STRIP_RE = re.compile("|".join(_STRIP_PATTERNS), re.IGNORECASE)

_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+|your\s+|previous\s+)?instructions",
    r"you\s+are\s+(now|actually|really)",
    r"pretend\s+(to\s+be|you\s+are)",
    r"(system|admin|root)\s*(:|\s+prompt|\s+message)",
    r"reveal\s+(your|the)\s+(system\s+|hidden\s+)?prompt",
    r"what\s+(is|are)\s+your\s+(instructions|rules|system\s+prompt)",
    r"\bjailbreak\b",
    r"\bDAN\b",
    r"do\s+anything\s+now",
    r"act\s+as\s+(if\s+you\s+(are|were)|an?\s+)",
]
_INJECTION_RES = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]

_OUTPUT_BLOCK_PATTERNS = [
    re.compile(r"(?:sk-|pcp_|APCA-)[A-Za-z0-9]{20,}"), # API key with known prefix
    re.compile(r"pcp_[a-z0-9_]+"),                     # Paperclip token
    re.compile(r"nats://"),                             # NATS URL
    re.compile(r"localhost:\d+"),                       # Internal port
    re.compile(r"/Users/[^\s]+"),                       # Filesystem path
    re.compile(r"\b(you should (buy|sell|invest))\b", re.IGNORECASE),
]


def sanitize_input(message: str) -> str:
    if len(message) > _MAX_LENGTH:
        message = message[:_MAX_LENGTH]
    message = _STRIP_RE.sub(" ", message)
    message = re.sub(r"\s{2,}", " ", message).strip()
    return message


def detect_injection(message: str) -> tuple[int, bool]:
    """Returns (match_count, is_injection). Injection flagged at 2+ matches."""
    matches = sum(1 for p in _INJECTION_RES if p.search(message))
    return matches, matches >= 2


def filter_output(text: str) -> str | None:
    """Returns filtered text, or None if a hard-block pattern matched."""
    for pattern in _OUTPUT_BLOCK_PATTERNS:
        if pattern.search(text):
            return None
    return text
