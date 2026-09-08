"""Prepare a bounded, silent frame sequence from the supplied ETRO film.

Usage: python scripts/prepare_etro_scroll.py /path/to/ETRO.mp4
Requires ffmpeg. Never overwrites existing output; the original stays untouched.
"""
import argparse
import json
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    root = Path(__file__).resolve().parents[1] / "frontend/public/residences/etro/scroll-v1"
    if root.exists():
        raise SystemExit(f"Output already exists, leaving it unchanged: {root}")
    root.mkdir(parents=True)
    for name, width in (("desktop", 540), ("mobile", 360)):
        target = root / name
        target.mkdir()
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-n",
            "-ss", "3.52", "-i", str(source), "-t", "9.6", "-an",
            "-vf", f"fps=15,scale={width}:-2", "-c:v", "libwebp",
            "-quality", "68", "-compression_level", "5", "-start_number", "0",
            str(target / "frame-%03d.webp"),
        ], check=True)
        frames = sorted(target.glob("frame-*.webp"))
        if len(frames) != 144:
            raise SystemExit(f"Expected 144 frames, got {len(frames)}; inspect {target}")
        print(f"{name}: {len(frames)} frames, {sum(f.stat().st_size for f in frames):,} bytes")
    (root / "manifest.json").write_text(json.dumps({
        "frames": 144, "fps": 15, "source_start": 3.52, "duration": 9.6,
        "source": "User-supplied ETRO.mp4, Google Drive file 1TgucrfOuL-nPSMxLZvnbYbsSwiEhkLHe",
        "desktop": {"width": 540, "height": 960},
        "mobile": {"width": 360, "height": 640},
        "pattern": "frame-%03d.webp",
    }, indent=2) + "\n")


if __name__ == "__main__":
    main()
