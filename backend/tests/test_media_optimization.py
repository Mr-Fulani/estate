import io
import hashlib
import json
import mimetypes
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from PIL import Image
from app.media_optimization import optimize_image, optimize_video, publish
from app.import_property_media import download_drive, drive_id, import_one, replace_urls, sources
from app.media_static import MediaStaticFiles
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.testclient import TestClient


class OptimizationTests(unittest.TestCase):
    def test_inline_drive_download_and_invalid_response_limits(self):
        for media_type, chunks, valid in [("image/jpeg", [b"image"], True), ("text/html", [b"login"], False), ("image/jpeg", [b"a" * (1024 * 1024), b"b"], False)]:
            with self.subTest(media_type=media_type, valid=valid), tempfile.TemporaryDirectory() as work:
                response = MagicMock()
                response.headers = {"Content-Type": media_type, "Content-Disposition": "inline"}
                response.iter_content.return_value = iter(chunks)
                response.__enter__.return_value = response
                with patch("app.import_property_media.subprocess.run", side_effect=subprocess.CalledProcessError(1, "gdown")), patch("app.import_property_media.requests.get", return_value=response), patch("app.import_property_media.settings.MEDIA_MAX_IMAGE_MB", 1):
                    source = Path(work) / "source"
                    if valid:
                        download_drive("abcdefghijk", source, "photo")
                        self.assertEqual(source.read_bytes(), b"image")
                    else:
                        with self.assertRaises(ValueError):
                            download_drive("abcdefghijk", source, "photo")

    def test_drive_aliases_reuse_download_and_replace_each_source(self):
        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            cache = root / "cache"
            cache.mkdir()
            file = publish(b"saved image", root / "properties" / "optimized", ".webp")
            first = "https://drive.google.com/file/d/abcdefghijk/view"
            alias = "https://drive.google.com/uc?id=abcdefghijk&export=view"
            local = "/uploads/properties/optimized/" + file.name
            key = hashlib.sha256(b"v1:abcdefghijk:photo").hexdigest()
            record = {"source": first, "url": local, "output_sha256": file.stem}
            (cache / (key + ".json")).write_text(json.dumps(record))
            with patch("app.import_property_media.MEDIA_ROOT", root), patch("app.import_property_media.subprocess.run") as download:
                records = [import_one(url, "photo", cache) for url in (first, alias)]
                download.assert_not_called()
            rewritten = replace_urls({"images": [first, alias], "image_details": {alias: {"alt": "caption"}}}, {r["source"]: r["url"] for r in records})
            self.assertEqual(rewritten["images"], [local, local])
            self.assertIn(local, rewritten["image_details"])
            self.assertFalse(sources({"images": rewritten["images"], "videos": [], "development": {}, "units": []}))
            self.assertEqual(len(list((root / "properties" / "optimized").iterdir())), 1)

    def test_photo_dimensions_and_alpha_survive(self):
        image = Image.new("RGBA", (3000, 1500), (10, 20, 30, 128))
        source = io.BytesIO()
        image.save(source, "PNG")
        optimized = Image.open(io.BytesIO(optimize_image(source.getvalue())))
        self.assertEqual(optimized.size, (2560, 1280))
        self.assertEqual(optimized.getpixel((0, 0))[3], 128)

    def test_plan_is_lossless_without_upscaling(self):
        image = Image.new("RGB", (100, 80), "white")
        image.putpixel((25, 25), (0, 0, 0))
        source = io.BytesIO()
        image.save(source, "PNG")
        optimized = Image.open(io.BytesIO(optimize_image(source.getvalue(), plan=True)))
        self.assertEqual(optimized.size, image.size)
        self.assertEqual(optimized.tobytes(), image.tobytes())

    def test_identical_content_reuses_file_and_different_content_does_not(self):
        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            first = publish(b"first", root, ".webp")
            self.assertEqual(first, publish(b"first", root, ".webp"))
            self.assertNotEqual(first, publish(b"second", root, ".webp"))
            self.assertEqual(len(list(root.iterdir())), 2)

    def test_url_replacement_includes_metadata_keys_and_preserves_other_values(self):
        source = {"images": ["old"], "image_details": {"old": {"alt": "caption"}}, "plan_details": [{"url": "old", "area": 42}], "brochure": "untouched"}
        result = replace_urls(source, {"old": "/uploads/new"})
        self.assertIn("/uploads/new", result["image_details"])
        self.assertEqual(result["plan_details"][0], {"url": "/uploads/new", "area": 42})
        self.assertEqual(result["brochure"], "untouched")
        self.assertEqual(source["images"], ["old"])

    def test_import_rejects_arbitrary_or_malformed_remote_hosts(self):
        self.assertEqual(drive_id("https://drive.google.com/file/d/abcdefghijk/view"), "abcdefghijk")
        for url in ("http://127.0.0.1/file", "https://drive.google.com.evil.test/?id=abcdefghijk", "https://drive.google.com/?id=.."):
            with self.assertRaises(ValueError):
                drive_id(url)

    def test_hashed_media_supports_cache_and_byte_ranges(self):
        with tempfile.TemporaryDirectory() as work:
            root = Path(work)
            target = publish(b"0123456789", root / "properties" / "optimized", ".mp4")
            (root / "legacy.mp4").write_bytes(b"old")
            image = publish(b"webp", root / "properties" / "optimized", ".webp")
            with patch.dict(mimetypes.types_map, {".webp": "text/plain", ".mp4": "text/plain"}):
                client = TestClient(Starlette(routes=[Mount("/uploads", app=MediaStaticFiles(directory=root))]))
                self.assertEqual(client.get("/uploads/properties/optimized/" + image.name).headers["Content-Type"], "image/webp")
                self.assertEqual(client.get("/uploads/properties/optimized/" + target.name).headers["Content-Type"], "video/mp4")
            url = "/uploads/properties/optimized/" + target.name
            response = client.get(url, headers={"Range": "bytes=2-4"})
            self.assertEqual(response.status_code, 206)
            self.assertEqual(response.content, b"234")
            self.assertIn("immutable", response.headers["Cache-Control"])
            self.assertEqual(client.get(url, headers={"If-None-Match": response.headers["etag"]}).status_code, 304)
            self.assertNotIn("immutable", client.get("/uploads/legacy.mp4").headers.get("Cache-Control", ""))

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
    def test_video_transcode_preserves_audio_and_limits_dimensions(self):
        with tempfile.TemporaryDirectory() as work:
            source = Path(work) / "source.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "color=size=2000x1120:rate=10:duration=1", "-f", "lavfi", "-i", "sine=duration=1", "-c:v", "libx264", "-threads", "2", "-c:a", "aac", "-shortest", str(source)], check=True, timeout=60)
            result = optimize_video(source, Path(work) / "optimized")
            probe = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(result)], capture_output=True, check=True)
            streams = json.loads(probe.stdout)["streams"]
            video = next(s for s in streams if s["codec_type"] == "video")
            self.assertLessEqual(video["width"], 1920)
            self.assertLessEqual(video["height"], 1080)
            self.assertTrue(any(s["codec_type"] == "audio" for s in streams))
            self.assertTrue(source.exists())
