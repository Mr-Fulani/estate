"""Explicit, source-backed Vadi enrichment; downloads finish before database writes.

python -m app.enrich_vadi [--apply] [--slug SLUG]
"""
import argparse
import asyncio
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.property import Property
from app.import_property_media import import_one, snapshot
from app.media_storage import MEDIA_ROOT, settings
from app.media_optimization import publish
from app.schemas.property import DevelopmentProfile

MANIFEST = Path(__file__).parent / "data" / "vadi-source-media.json"
COPY = Path(__file__).parent / "data" / "vadi-editorial.json"


def ordered(files):
    return sorted(files, key=lambda item: (int(item["title"].split("-")[0].strip()) if item["title"].split("-")[0].strip().isdigit() else 100, item["title"]))


def download_brochure(cache):
    target_record = cache / "vadi-brochure.json"
    if target_record.exists():
        record = json.loads(target_record.read_text())
        target = MEDIA_ROOT / record["url"].removeprefix(settings.MEDIA_URL.rstrip("/") + "/")
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == record["sha256"]:
            return record["url"]
    with tempfile.TemporaryDirectory(prefix="vadi-brochure-") as work:
        source = Path(work) / "brochure.pdf"
        subprocess.run([sys.executable, "-m", "gdown", "https://drive.google.com/uc?id=13UNgOdepilSN4AFdtqcUsLANwTfBo3ZB", "-O", str(source), "--quiet", "--no-cookies"], check=True, capture_output=True, timeout=600)
        content = source.read_bytes()
        if not content.startswith(b"%PDF-") or len(content) > 25 * 1024 * 1024:
            raise ValueError("Invalid brochure")
        target = publish(content, MEDIA_ROOT / "properties" / "optimized", ".pdf")
        url = f"{settings.MEDIA_URL.rstrip('/')}/properties/optimized/{target.name}"
        target_record.write_text(json.dumps({"url": url, "sha256": target.stem}))
        return url


async def run(args):
    cache = Path(args.state_dir)
    cache.mkdir(parents=True, exist_ok=True)
    groups = json.loads(MANIFEST.read_text())["groups"]
    editorial = json.loads(COPY.read_text())
    async with AsyncSessionLocal() as db:
        prop = await db.scalar(select(Property).where(Property.slug == args.slug))
        if prop is None or prop.listing_kind != "development":
            raise ValueError("Development not found")
        before = snapshot(prop)
        identity = prop.id
        descriptions = {t.locale: t.description for t in prop.translations}
        description = prop.description
        expected = {"6+1", "7+1", "10+1"}
        if not expected.issubset({u.code.split()[0] for u in prop.unit_types}):
            raise ValueError("Expected villa types missing")

    records = []
    urls = {}
    requested = [(f, "video" if f["mime_type"].startswith("video/") else "plan" if key == "1f0BPziAqOoP6_RlbSYRqgjh9-nrUjZ-0" else "photo") for key, files in groups.items() for f in ordered(files)]
    for index, (file, kind) in enumerate(requested, 1):
        print(f"[{index}/{len(requested)}] {file['title']}", flush=True)
        record = await asyncio.to_thread(import_one, file["url"], kind, cache)
        records.append({**record, "title": file["title"]})
        urls[file["id"]] = record["url"]
        print(f"  {record['original_bytes']} -> {record['optimized_bytes']}", flush=True)
    brochure = await asyncio.to_thread(download_brochure, cache)
    project = ordered(groups["project"])
    location = groups["1PwvtZU0EjVhIIKceWP0sPPc_mPNxrq8y"]
    image_ids = [project[0]["id"], "16_cys5y8W52ZhHvMk01JIBjtnnoZptrs"] + [f["id"] for f in project[1:]] + [f["id"] for f in groups["site"]] + [f["id"] for f in location if f["id"] != "16_cys5y8W52ZhHvMk01JIBjtnnoZptrs"]
    general_videos = ["1n0wQ8NIu55ldVftQ8tYXLtmTMXA8gH7j", "1_x4tRtsh1fr2Vp2ee5EYlZ48lQNwX1ha", "16_MYtE4ZnO-tNKG4uJZ985x3NPoou_fx", "12ARSHUweaNIPb573RyAdP7Zechk7jHW4", "1bqyqWngKnwONct2_EFjsHifnDMFrgSz4"]
    unit_videos = {"6+1": "15Dd1XHw11iPg6U5B3WACPayFlrZVC-UG", "7+1": "1r6rZpUDqcSYKTDFryTgmzuIFFxwfdnU0", "10+1": "1dCBWCYf116qDw1xOgWMkpsAKr_DT5PoF"}
    unique = lambda values: list(dict.fromkeys(values))
    profile = copy.deepcopy(before["development"])
    profile.update(interior_images=unique([urls[f["id"]] for f in ordered(groups["sample"])]), hero_videos=unique([urls[i] for i in general_videos]), hero_video_url=None, brochure_url=brochure, images_are_renders=False)
    profile.setdefault("translations", {})
    for locale, values in editorial.items():
        profile["translations"][locale] = {**profile["translations"].get(locale, {}), **values["editorial"]}
    DevelopmentProfile.model_validate(profile)
    images = unique([urls[i] for i in image_ids])
    report = {"property_id": identity, "before": before, "descriptions_before": descriptions, "description_before": description, "files": records, "images": images, "development": profile, "unit_videos": {code: urls[i] for code, i in unit_videos.items()}}
    path = cache / f"vadi-enrichment-{identity}-{hashlib.sha256(json.dumps(report, sort_keys=True).encode()).hexdigest()[:12]}.json"
    if not path.exists():
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Report: {path}; {len(images)} project photos; {len(profile['interior_images'])} sample-villa photos; {len(profile['hero_videos'])} unique project videos", flush=True)
    if not args.apply:
        print("Review only: database unchanged", flush=True)
        return
    async with AsyncSessionLocal() as db:
        prop = await db.scalar(select(Property).where(Property.id == identity).with_for_update())
        if prop is None or snapshot(prop) != before or prop.description != description or {t.locale: t.description for t in prop.translations} != descriptions:
            raise RuntimeError("Project edited during enrichment; nothing applied")
        prop.images = images
        prop.videos = profile["hero_videos"]
        prop.development = profile
        prop.description = editorial[prop.content_locale]["description"]
        for translation in prop.translations:
            translation.description = editorial[translation.locale]["description"]
        for unit in prop.unit_types:
            code = unit.code.split()[0]
            if code in report["unit_videos"]:
                unit.video_url = report["unit_videos"][code]
        await db.commit()
    print("Enrichment applied", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--slug", default="brand-vadi-istanbul-villy-v-byuyyukchekmedzhe-ff9239")
    parser.add_argument("--state-dir", default="/app/media-import")
    parser.add_argument("--apply", action="store_true")
    asyncio.run(run(parser.parse_args()))
