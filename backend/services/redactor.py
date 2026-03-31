import re
from typing import Any

# Fields to completely remove from any dict at any depth
STRIP_FIELDS = {
    "adapterConfig", "runtimeConfig", "budgetMonthlyCents", "spentMonthlyCents",
    "apiKey", "apiSecret", "token", "secret", "key", "password", "credential",
    "accessToken", "refreshToken", "webhookSecret",
}

# Regex patterns to redact from string values
REDACT_PATTERNS = [
    (re.compile(r'pcp_[a-f0-9]{40,}'), '[redacted-token]'),
    (re.compile(r'localhost:\d+'), '[internal-host]'),
    (re.compile(r'127\.0\.0\.1:\d+'), '[internal-host]'),
    (re.compile(r'/Users/[^/\s"\']+'), '[local-path]'),
    (re.compile(r'sk-[a-zA-Z0-9]{20,}'), '[redacted-key]'),
    (re.compile(r'APCA-[A-Z0-9]{20,}'), '[redacted-key]'),
]


def redact(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {
            k: redact(v)
            for k, v in obj.items()
            if k not in STRIP_FIELDS and not any(pat in k.lower() for pat in ['token', 'secret', 'key', 'password', 'credential'])
        }
    elif isinstance(obj, list):
        return [redact(item) for item in obj]
    elif isinstance(obj, str):
        result = obj
        for pattern, replacement in REDACT_PATTERNS:
            result = pattern.sub(replacement, result)
        return result
    return obj
