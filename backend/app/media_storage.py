import asyncio
from pathlib import Path
from uuid import uuid4

from app.config import get_settings


settings = get_settings()
MEDIA_ROOT = Path(settings.MEDIA_ROOT).resolve()
NEWS_MEDIA_ROOT = (MEDIA_ROOT / "news").resolve()
NEWS_MEDIA_ROOT.mkdir(parents=True, exist_ok=True)


def detect_image_extension(content: bytes) -> str | None:
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return ".gif"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return ".webp"
    return None


async def save_news_image(content: bytes) -> str:
    extension = detect_image_extension(content)
    if extension is None:
        raise ValueError("Unsupported image format")
    filename = f"{uuid4().hex}{extension}"
    target = NEWS_MEDIA_ROOT / filename
    temporary = NEWS_MEDIA_ROOT / f".{filename}.tmp"

    def write_file() -> None:
        temporary.write_bytes(content)
        temporary.replace(target)

    await asyncio.to_thread(write_file)
    return f"{settings.MEDIA_URL.rstrip('/')}/news/{filename}"


async def delete_owned_news_file(url: str | None) -> None:
    if not url:
        return
    prefix = f"{settings.MEDIA_URL.rstrip('/')}/news/"
    if not url.startswith(prefix):
        return
    filename = url.removeprefix(prefix)
    if not filename or "/" in filename or "\\" in filename:
        return
    target = (NEWS_MEDIA_ROOT / filename).resolve()
    if not target.is_relative_to(NEWS_MEDIA_ROOT):
        return
    await asyncio.to_thread(target.unlink, missing_ok=True)


async def delete_owned_news_files(urls: set[str | None]) -> None:
    await asyncio.gather(*(delete_owned_news_file(url) for url in urls))
