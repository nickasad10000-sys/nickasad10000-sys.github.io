"""TITAN PRO V8 — Number formatting helpers.

Convert raw integer counts (or Indonesian "892.000" style) into the
short K/M format used across the dashboard.
"""

from __future__ import annotations
import re
from typing import Any


def parse_int(value: Any) -> int | None:
    """Best-effort parse of a count that may be int, str, or formatted.

    Examples:
        parse_int(2800) -> 2800
        parse_int("2.800") -> 2800         # Indo thousand separator
        parse_int("892.000") -> 892000     # Indo thousand separator
        parse_int("1.234.567") -> 1234567  # multi-dot separator
        parse_int("2.8K") -> 2800          # 2.8 * 1000
        parse_int("4.9M") -> 4900000       # 4.9 * 1_000_000
        parse_int("17,5K") -> 17500        # comma decimal
        parse_int("428,8") -> 428          # NOT 4288 (small comma)
    """
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).strip()
    if not s:
        return None

    # K/M suffix — match digits + optional dot/comma + K|M
    m = re.match(r"^([\d.,]+)\s*([KkMm])$", s)
    if m:
        num_str = m.group(1)
        suffix = m.group(2).lower()
        try:
            num = float(num_str.replace(",", "."))
        except ValueError:
            num = 0.0
        mult = 1_000 if suffix == "k" else 1_000_000
        return int(num * mult)

    # Pure number string. Decide if . or , is decimal vs separator.
    # Rule: if the string has BOTH . and , -> last one wins as decimal.
    #        if only . -> if exactly 3 digits after, it's thousand sep.
    #        if only , -> if exactly 3 digits after, it's thousand sep.
    has_dot = "." in s
    has_comma = "," in s
    if has_dot and has_comma:
        # Last occurrence is the decimal separator
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif has_dot:
        # 3 digits after dot = thousand sep; else decimal
        parts = s.split(".")
        if len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit():
            s = s.replace(".", "")
        # else: leave as decimal (e.g. "2.8")
    elif has_comma:
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit():
            s = s.replace(",", "")
        else:
            s = s.replace(",", ".")

    try:
        return int(float(s))
    except (ValueError, TypeError):
        return int(re.sub(r"[^\d]", "", s) or 0) or None


def format_short(value: int | float | None) -> str:
    """Format a number in K/M short style, matching the V8 dashboard.

    Examples:
        format_short(2800) -> "2.8K"
        format_short(892000) -> "892K"
        format_short(1234567) -> "1.23M"
        format_short(428) -> "428"
        format_short(None) -> "—"
    """
    if value is None:
        return "—"
    n = int(value)
    if n < 0:
        return str(n)
    if n < 1_000:
        return str(n)
    if n < 1_000_000:
        k = n / 1_000
        if k < 10:
            # Strip trailing .0 (1.0K -> 1K), keep 1-decimal otherwise
            s = f"{k:.1f}K"
            return s.replace(".0K", "K")
        return f"{int(k + 0.5):d}K"
    m = n / 1_000_000
    if m < 10:
        s = f"{m:.2f}M"
        return s.replace(".00M", "M")
    if m < 100:
        s = f"{m:.1f}M"
        return s.replace(".0M", "M")
    return f"{int(m + 0.5):d}M"


def format_pct(numerator: int, denominator: int, decimals: int = 2) -> str:
    """Format a percentage. Returns '0.00%' if denominator is 0."""
    if not denominator:
        return f"{0:.{decimals}f}%"
    pct = (numerator / denominator) * 100
    return f"{pct:.{decimals}f}%"


def normalize_dict_strings(d: Any) -> Any:
    """Walk dict/list and reformat any string value that looks like a formatted
    number into the short K/M form. Pure function, no side effects."""
    if isinstance(d, dict):
        return {k: normalize_dict_strings(v) for k, v in d.items()}
    if isinstance(d, list):
        return [normalize_dict_strings(x) for x in d]
    if isinstance(d, str):
        n = parse_int(d)
        if n is not None and n != 0 and d.strip() not in ("0", "—"):
            return format_short(n)
    return d


if __name__ == "__main__":
    # Quick sanity test
    cases = [
        ("892.000", 892000),
        ("2.800", 2800),
        ("2.8K", 2800),
        ("4.9M", 4900000),
        ("1.234.567", 1234567),
        ("17,5K", 17500),
        ("428,8", 428),
        ("1.000", 1000),
        ("17.500", 17500),
        (None, None),
    ]
    print("parse_int tests:")
    for inp, expected in cases:
        got = parse_int(inp)
        ok = "OK" if got == expected else "FAIL"
        print(f"  {ok}  parse_int({inp!r}) = {got} (expected {expected})")
    print()
    print("format_short tests:")
    for n, expected in [(2800, "2.8K"), (892000, "892K"), (1234567, "1.23M"), (428, "428"), (17500, "18K"), (1000, "1K"), (10000, "10K"), (4999, "5K"), (500, "500")]:
        got = format_short(n)
        ok = "OK" if got == expected else "FAIL"
        print(f"  {ok}  format_short({n}) = {got!r} (expected {expected!r})")
