"""TITAN PRO V8 — Cookies file parser.

Accepts both formats:
  1. JSON (Cookie-Editor / EditThisCookie export) — starts with `[`
  2. Netscape HTTP Cookie File (curl/wget format) — tab-separated with # comments

Returns a list of dicts in Playwright `add_cookies` format:
  {name, value, domain, path, expires, httpOnly, secure, sameSite}

Usage:
  from .cookies_loader import load_cookies
  cookies = load_cookies()  # reads scripts/scrape/cookies.txt
  ctx.add_cookies(cookies)
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Any

COOKIES_PATH = Path(__file__).parent / "cookies.txt"

# Playwright only accepts Strict|Lax|None
_SAMESITE_MAP = {
    "unspecified": "None",
    "no_restriction": "None",
    "lax": "Lax",
    "strict": "Strict",
}


def _parse_netscape(raw: str) -> list[dict[str, Any]]:
    """Parse Netscape HTTP Cookie File format.

    7 tab-separated columns: domain, flag, path, secure, expiration, name, value.
    Lines starting with # are comments; empty lines skipped.
    The prefix `#HttpOnly_` on a domain means the cookie is HTTP-only.
    """
    cookies: list[dict[str, Any]] = []
    for line in raw.splitlines():
        if not line:
            continue
        http_only = False
        # #HttpOnly_ prefix means HTTP-only cookie
        if line.startswith("#HttpOnly_"):
            http_only = True
            line = line[len("#HttpOnly_"):]
        elif line.startswith("# ") or line == "#":
            continue
        parts = line.split("\t")
        if len(parts) < 7:
            continue
        domain, _flag, path, secure, expires, name, value = parts[:7]
        exp = int(float(expires)) if expires and expires not in ("0", "") else -1
        cookies.append({
            "name": name,
            "value": value,
            "domain": domain,
            "path": path,
            "expires": exp,
            "httpOnly": http_only,
            "secure": secure.upper() == "TRUE",
            "sameSite": "Lax",
        })
    return cookies


def _parse_json(raw: str) -> list[dict[str, Any]]:
    """Parse JSON cookie export (EditThisCookie / Cookie-Editor).

    Normalizes sameSite: Playwright only accepts Strict|Lax|None.
    """
    data = json.loads(raw)
    for c in data:
        ss = str(c.get("sameSite", "")).lower()
        if ss in _SAMESITE_MAP:
            c["sameSite"] = _SAMESITE_MAP[ss]
        elif ss not in ("strict", "lax", "none"):
            c["sameSite"] = "None"
        # Convert expirationDate (float seconds) → expires (int unix seconds)
        if "expirationDate" in c and "expires" not in c:
            c["expires"] = int(c["expirationDate"])
    return data


def load_cookies(path: Path | str | None = None) -> list[dict[str, Any]]:
    """Load cookies from file. Auto-detects JSON or Netscape format.

    Returns list of cookie dicts ready for Playwright `context.add_cookies()`.
    Returns empty list if file doesn't exist.
    """
    p = Path(path) if path else COOKIES_PATH
    if not p.exists():
        return []
    raw = p.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    if raw.startswith("["):
        return _parse_json(raw)
    if raw.startswith("#") or "\t" in raw:
        return _parse_netscape(raw)
    raise ValueError(
        f"Unknown cookies.txt format (starts with {raw[:30]!r}). "
        "Expected JSON array or Netscape HTTP Cookie File."
    )


def has_cookies(path: Path | str | None = None) -> bool:
    """Check if cookies.txt exists and is non-empty."""
    p = Path(path) if path else COOKIES_PATH
    if not p.exists():
        return False
    raw = p.read_text(encoding="utf-8").strip()
    return bool(raw)


def cookies_domains(path: Path | str | None = None) -> set[str]:
    """Return set of domains in cookies file (e.g. {'.instagram.com', '.tiktok.com'})."""
    return {c["domain"] for c in load_cookies(path)}


if __name__ == "__main__":
    from pprint import pprint
    cookies = load_cookies()
    print(f"Loaded {len(cookies)} cookies")
    print(f"Domains: {cookies_domains()}")
    print()
    pprint(cookies[:2])
