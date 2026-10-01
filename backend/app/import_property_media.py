"""Import public Drive media for any property; commit URLs only after all transforms succeed.

Run inside the API container: python -m app.import_property_media --slug SLUG
Use --apply after reviewing the generated report; without it the database is untouched.
"""
import argparse
import asyncio
import hashlib
import json
from pathlib import Path
import re
import tempfile
from urllib.parse import parse_qs, urlparse

import subprocess
import sys
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.property import Property
from app.media_storage import MEDIA_ROOT, settings
from app.media_optimization import optimize_image, optimize_video, publish


def drive_id(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "drive.google.com":
        raise ValueError("Only public Google Drive file links are supported; upload other files through admin")
    match = re.search(r"/file/d/([\w-]+)", parsed.path)
    identity = match.group(1) if match else parse_qs(parsed.query).get("id", [""])[0]
    if not re.fullmatch(r"[\w-]{10,200}", identity):
        raise ValueError("Invalid Drive file ID")
    return identity


def snapshot(prop):
    return {"images": prop.images or [], "videos": prop.videos or [], "image_details": prop.image_details or {}, "development": prop.development or {}, "units": [{"id": u.id, "plans": u.plans or [], "plan_details": u.plan_details or [], "media_images": u.media_images or [], "video_url": u.video_url} for u in prop.unit_types]}


def sources(data):
    result = {}
    def add(urls, kind):
        for url in urls:
            if url and not url.startswith("/"):
                previous = result.get(url)
                if previous and (previous == "video") != (kind == "video"):
                    raise ValueError("One source is assigned to incompatible media types")
                result[url] = "plan" if previous == "plan" or kind == "plan" else kind
    add(data["images"], "photo")
    add(data["videos"], "video")
    profile = data["development"]
    add(profile.get("interior_images", []), "photo")
    add(profile.get("hero_videos", []), "video")
    add([profile.get("hero_video_url")], "video")
    for unit in data["units"]:
        add(unit["plans"], "plan")
        add(unit["media_images"], "photo")
        add([unit["video_url"]], "video")
    return result


def replace_urls(value, mapping):
    if isinstance(value, str):
        return mapping.get(value, value)
    if isinstance(value, list):
        return [replace_urls(item, mapping) for item in value]
    if isinstance(value, dict):
        return {mapping.get(key, key): replace_urls(item, mapping) for key, item in value.items()}
    return value


def import_one(url, kind, cache):
    identity = drive_id(url)
    key = hashlib.sha256(f"v1:{identity}:{kind}".encode()).hexdigest()
    record_path = cache / f"{key}.json"
    if record_path.exists():
        record = json.loads(record_path.read_text())
        target = MEDIA_ROOT / record["url"].removeprefix(settings.MEDIA_URL.rstrip('/') + '/')
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == record["output_sha256"]:
            return record
    with tempfile.TemporaryDirectory(prefix="estate-drive-") as work:
        source = Path(work) / "source"
        subprocess.run([sys.executable, "-m", "gdown", f"https://drive.google.com/uc?id={identity}", "-O", str(source), "--quiet", "--no-cookies"], check=True, capture_output=True, timeout=600)
        size = source.stat().st_size
        limit = (settings.MEDIA_MAX_VIDEO_MB if kind == "video" else settings.MEDIA_MAX_IMAGE_MB) * 1024 * 1024
        if not 0 < size <= limit:
            raise ValueError(f"Source exceeds media size limit: {identity}")
        content = source.read_bytes()
        root = MEDIA_ROOT / "properties" / "optimized"
        target = optimize_video(source, root) if kind == "video" else publish(optimize_image(content, plan=kind == "plan"), root, ".webp")
        record = {"source": url, "kind": kind, "source_sha256": hashlib.sha256(content).hexdigest(), "original_bytes": size, "optimized_bytes": target.stat().st_size, "output_sha256": target.stem, "url": f"{settings.MEDIA_URL.rstrip('/')}/properties/optimized/{target.name}"}
        # Cache is outside the served upload directory, with no credentials or cookies.
        record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2))
        return record


async def run(args):
    cache = Path(args.state_dir)
    cache.mkdir(parents=True, exist_ok=True)
    async with AsyncSessionLocal() as db:
        prop = await db.scalar(select(Property).where(Property.slug == args.slug))
        if prop is None:
            raise ValueError("Property not found")
        original = snapshot(prop)
        identity = prop.id
    # Do not hold a database transaction during network downloads or encoding.
    records = []
    requested = sources(original)
    for index, (url, kind) in enumerate(requested.items(), 1):
        print(f"[{index}/{len(requested)}] {kind}", flush=True)
        record = await asyncio.to_thread(import_one, url, kind, cache)
        records.append(record)
        print(f"  {record['original_bytes']} -> {record['optimized_bytes']} bytes", flush=True)
    report = {"property_id": identity, "slug": args.slug, "before": original, "files": records}
    report_path = cache / f"property-{identity}-{hashlib.sha256(json.dumps(report, sort_keys=True).encode()).hexdigest()[:12]}.json"
    if not report_path.exists():
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Report: {report_path}", flush=True)
    if not args.apply:
        print("Review only: database unchanged", flush=True)
        return
    rewritten = replace_urls(original, {r["source"]: r["url"] for r in records})
    async with AsyncSessionLocal() as db:
        prop = await db.scalar(select(Property).where(Property.id == identity).with_for_update())
        if prop is None or snapshot(prop) != original:
            raise RuntimeError("Property changed during import; database not modified")
        prop.images = rewritten["images"]
        prop.videos = rewritten["videos"]
        prop.image_details = rewritten["image_details"]
        prop.development = rewritten["development"] or None
        units = {u["id"]: u for u in rewritten["units"]}
        for unit in prop.unit_types:
            for field in ("plans", "plan_details", "media_images", "video_url"):
                setattr(unit, field, units[unit.id][field])
        await db.commit()
    print("Imported successfully", flush=True)


async def watch(args):
    """Sequential worker: new public Drive links are processed without blocking admin saves."""
    while True:
        async with AsyncSessionLocal() as db:
            props = (await db.scalars(select(Property))).all()
            slugs = [p.slug for p in props if sources(snapshot(p))]
        for slug in slugs:
            try:
                await run(argparse.Namespace(slug=slug, state_dir=args.state_dir, apply=True))
            except Exception as error:
                # Keep original links on failure. Other projects remain processable.
                print(f"Import failed for {slug}: {type(error).__name__}: {error}", flush=True)
        await asyncio.sleep(300)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug")
    parser.add_argument("--watch", action="store_true")
    parser.add_argument("--state-dir", default="/app/media-import")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not args.watch and not args.slug:
        parser.error("Specify --slug or --watch")
    asyncio.run(watch(args) if args.watch else run(args))
