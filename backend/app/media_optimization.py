"""Bounded local transforms. Original uploads are never used as FFmpeg URLs."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageOps


def optimize_image(content: bytes, *, plan: bool = False) -> bytes:
    with Image.open(io.BytesIO(content)) as source:
        if getattr(source, "is_animated", False):
            raise ValueError("Animated images must be uploaded as video")
        image = ImageOps.exif_transpose(source)
        image.thumbnail((3200, 3200) if plan else (2560, 2560), Image.Resampling.LANCZOS)
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        output = io.BytesIO()
        image.save(output, "WEBP", quality=90 if plan else 82, method=6, lossless=plan)
        return output.getvalue()


def publish(content: bytes, root: Path, extension: str) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    target = root / (hashlib.sha256(content).hexdigest() + extension)
    # Exclusive creation prevents concurrent identical uploads overwriting one another.
    if not target.exists():
        with tempfile.NamedTemporaryFile(dir=root, prefix=".media-", delete=False) as temporary:
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
            name = temporary.name
        try:
            os.link(name, target)
        except FileExistsError:
            pass
        finally:
            os.unlink(name)
    return target


def optimize_video(source: Path, root: Path) -> Path:
    with tempfile.TemporaryDirectory(prefix="estate-video-") as work:
        output = Path(work) / "video.mp4"
        subprocess.run([
            "ffmpeg", "-nostdin", "-v", "error", "-threads", "2", "-i", str(source),
            "-map", "0:v:0", "-map", "0:a:0?", "-vf",
            "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
            "-c:v", "libx264", "-preset", "medium", "-crf", "25", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-map_metadata", "-1", "-movflags", "+faststart",
            "-threads", "2", str(output),
        ], check=True, timeout=1800, capture_output=True)
        probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(output)], check=True, capture_output=True, timeout=30)
        if float(json.loads(probe.stdout)["format"]["duration"]) <= 0:
            raise ValueError("Invalid encoded video")
        return publish(output.read_bytes(), root, ".mp4")
