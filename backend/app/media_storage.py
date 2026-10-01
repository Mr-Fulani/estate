import asyncio
import os
from pathlib import Path
from uuid import uuid4
import tempfile
from app.media_optimization import optimize_image, optimize_video, publish

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
    return await save_image(content, "news")


async def save_image(content: bytes, collection: str, *, plan: bool = False) -> str:
    if collection not in {"news", "properties"}:
        raise ValueError("Unsupported media collection")
    extension = detect_image_extension(content)
    if extension is None:
        raise ValueError("Unsupported image format")
    if collection == "properties":
        root = MEDIA_ROOT / collection / "optimized"
        target = await asyncio.to_thread(lambda: publish(optimize_image(content, plan=plan), root, ".webp"))
        return f"{settings.MEDIA_URL.rstrip('/')}/{collection}/optimized/{target.name}"
    filename = f"{uuid4().hex}{extension}"
    root = MEDIA_ROOT / collection
    root.mkdir(parents=True, exist_ok=True)
    target = root / filename
    temporary = root / f".{filename}.tmp"

    def write_file() -> None:
        temporary.write_bytes(content)
        temporary.replace(target)

    await asyncio.to_thread(write_file)
    return f"{settings.MEDIA_URL.rstrip('/')}/{collection}/{filename}"


def detect_video_extension(content: bytes, filename: str = "") -> str | None:
    if len(content) >= 12 and content[4:8] == b"ftyp":
        return ".mov" if filename.lower().endswith(".mov") else ".mp4"
    if content.startswith(b"\x1a\x45\xdf\xa3"):
        return ".webm"
    if content.startswith(b"OggS"):
        return ".ogv"
    return None


async def save_video(upload, collection: str, extension: str) -> str:
    if collection != "properties" or extension not in {".mp4", ".mov", ".webm", ".ogv"}:
        raise ValueError("Unsupported video collection or format")
    async with VIDEO_ENCODER:
        def encode():
            with tempfile.TemporaryDirectory(prefix="estate-upload-") as work:
                source = Path(work) / f"source{extension}"
                with source.open("xb") as destination:
                    while chunk := upload.read(1024 * 1024):
                        destination.write(chunk)
                return optimize_video(source, MEDIA_ROOT / collection / "optimized")
        target = await asyncio.to_thread(encode)
        return f"{settings.MEDIA_URL.rstrip('/')}/{collection}/optimized/{target.name}"


VIDEO_ENCODER = asyncio.Semaphore(1)


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
