"""Download the user-supplied ETRO images and make web-sized local assets.

Run with Python + Pillow. Existing outputs are preserved. No cloud writes.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
from io import BytesIO

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "frontend/public/residences/etro"
SOURCES = {
    "exterior-01": "1v370OyCYo_wTXIDiSZM2QD6aqL0mzVGk",
    "exterior-02": "1fbPUzEhxyi0ZywQAv6qjJtjTPWxtR0H4",
    "exterior-03": "1-KNfwTPgm6SBi5b0_lqo3fv8RAeQX2NY",
    "exterior-04": "1jmONTi2pVsiNWLe0girXRVrNLhV4s6EP",
    "bedroom": "1dIMRjhiMXNDcpaonnmtEMzGg2Q3bS8IP",
    "living": "1OlE0r-XdwWWXZ7OcrkGqhmF6z4yG4TEp",
    "study": "1o0qxdxEe0bTunnnUg4sSMQx-_gqPn7A7",
    "lobby": "1AKjy7hlrxoGIrR_eiRY_XR0PMp6NJBiG",
    "plan-1-1": "187YWmTxemuQYPQGkiHdzVEcpE2OubNPn",
    "plan-2-1": "1nwdl6iVncsbJbWvcw4X4rlur_EtwkUjs",
    "plan-3-1-a": "1qrSeV1fkF41veTtPnVADsWQDnJtIgfME",
    "plan-3-1-b": "170paAU1HGbwvb72EmDNc7_En4YS_1VAg",
}


def import_image(item):
    name, file_id = item
    target = ROOT / f"{name}.webp"
    if target.exists():
        print(f"Already imported: {name}", flush=True)
        return
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download"
    with urlopen(url, timeout=120) as response:
        content = response.read(80 * 1024 * 1024)
    with Image.open(BytesIO(content)) as source:
        picture = ImageOps.exif_transpose(source).convert("RGB")
        picture.thumbnail((2400, 2400))
        picture.save(target, "WEBP", quality=88, method=6)
        print(f"Imported {name}: {picture.size}, {target.stat().st_size // 1024} KB", flush=True)


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(import_image, SOURCES.items()))
