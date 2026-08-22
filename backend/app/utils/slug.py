import re
import uuid


TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def clean_slug(value: str) -> str:
    slug = value.strip().lower()
    slug = "".join(TRANSLIT.get(char, char) for char in slug)
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return re.sub(r"-+", "-", slug).strip("-")


def generate_slug(value: str, fallback: str = "item", add_suffix: bool = True) -> str:
    base = clean_slug(value) or fallback
    return f"{base}-{uuid.uuid4().hex[:6]}" if add_suffix else base

