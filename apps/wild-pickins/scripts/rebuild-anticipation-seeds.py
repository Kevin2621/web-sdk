"""Replace the anticipation atlas's rock regions with bonus-transition seeds.

Uses only the Python standard library. The original Spine skeleton and all atlas
coordinates stay intact, so the existing animation timelines remain unchanged.
"""

from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1] / "static" / "assets"
ATLAS_DIR = ROOT / "spines" / "anticipation"
SEED_DIR = ROOT / "seed-transition"
SEED_FOR_ROCK = {
    "rock1": "seed1.png",
    "rock2": "seed2.png",
    "rock3": "seed3.png",
    "rock4": "seed1.png",
    "rock5": "seed2.png",
    "rock6": "seed3.png",
    "rock7": "seed1.png",
    "rock8": "seed2.png",
}
SIGNATURE = b"\x89PNG\r\n\x1a\n"


def load_png(path: Path):
    data = path.read_bytes()
    if not data.startswith(SIGNATURE):
        raise ValueError(f"Not a PNG: {path}")
    position = len(SIGNATURE)
    compressed = bytearray()
    while position < len(data):
        length = struct.unpack_from(">I", data, position)[0]
        kind = data[position + 4 : position + 8]
        payload = data[position + 8 : position + 8 + length]
        position += length + 12
        if kind == b"IHDR":
            width, height, depth, color, compression, filtering, interlace = struct.unpack(
                ">IIBBBBB", payload
            )
            if (depth, color, compression, filtering, interlace) != (8, 6, 0, 0, 0):
                raise ValueError(f"Expected non-interlaced RGBA PNG: {path}")
        elif kind == b"IDAT":
            compressed.extend(payload)
        elif kind == b"IEND":
            break

    raw = zlib.decompress(compressed)
    stride = width * 4
    pixels = bytearray(width * height * 4)
    previous = bytearray(stride)
    offset = 0
    for y in range(height):
        filter_type = raw[offset]
        offset += 1
        row = bytearray(raw[offset : offset + stride])
        offset += stride
        for i in range(stride):
            left = row[i - 4] if i >= 4 else 0
            above = previous[i]
            upper_left = previous[i - 4] if i >= 4 else 0
            if filter_type == 1:
                row[i] = (row[i] + left) & 255
            elif filter_type == 2:
                row[i] = (row[i] + above) & 255
            elif filter_type == 3:
                row[i] = (row[i] + (left + above) // 2) & 255
            elif filter_type == 4:
                prediction = left + above - upper_left
                distances = (abs(prediction - left), abs(prediction - above), abs(prediction - upper_left))
                predictor = (left, above, upper_left)[distances.index(min(distances))]
                row[i] = (row[i] + predictor) & 255
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter {filter_type}: {path}")
        pixels[y * stride : (y + 1) * stride] = row
        previous = row
    return width, height, pixels


def png_chunk(kind: bytes, payload: bytes):
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(
        ">I", zlib.crc32(kind + payload) & 0xFFFFFFFF
    )


def save_png(path: Path, width: int, height: int, pixels: bytearray):
    stride = width * 4
    rows = b"".join(b"\0" + pixels[y * stride : (y + 1) * stride] for y in range(height))
    path.write_bytes(
        SIGNATURE
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(rows, 9))
        + png_chunk(b"IEND", b"")
    )


def atlas_regions(text: str):
    regions = {}
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line in SEED_FOR_ROCK:
            bounds = tuple(map(int, lines[index + 1].split(":", 1)[1].split(",")))
            rotated = index + 2 < len(lines) and lines[index + 2] == "rotate:90"
            regions[line] = (*bounds, rotated)
    if set(regions) != set(SEED_FOR_ROCK):
        raise ValueError("Atlas rock regions changed; update this script before rebuilding")
    return regions


def replace_region(atlas, atlas_width, region, seed):
    x, y, width, height, rotated = region
    # Spine records unrotated bounds. A rotated region occupies height x width
    # pixels in the sheet. Draw into that physical rectangle with a small inset.
    physical_width, physical_height = (height, width) if rotated else (width, height)
    seed_width, seed_height, source = seed
    fit = min(width * 0.94 / seed_width, height * 0.94 / seed_height)
    display_width, display_height = seed_width * fit, seed_height * fit
    for py in range(physical_height):
        for px in range(physical_width):
            dest = ((y + py) * atlas_width + x + px) * 4
            atlas[dest : dest + 4] = b"\0\0\0\0"
            ux, uy = (py, physical_width - 1 - px) if rotated else (px, py)
            sx = (ux + 0.5 - (width - display_width) / 2) / fit - 0.5
            sy = (uy + 0.5 - (height - display_height) / 2) / fit - 0.5
            ix, iy = round(sx), round(sy)
            if 0 <= ix < seed_width and 0 <= iy < seed_height:
                start = (iy * seed_width + ix) * 4
                atlas[dest : dest + 4] = source[start : start + 4]


def main():
    atlas_path = ATLAS_DIR / "anticipation.atlas"
    atlas_text = atlas_path.read_text()
    regions = atlas_regions(atlas_text)
    width, height, sheet = load_png(ATLAS_DIR / "anticipation.png")
    if (width, height) != (1140, 1036):
        raise ValueError("Unexpected anticipation sheet size")
    seeds = {name: load_png(SEED_DIR / name) for name in set(SEED_FOR_ROCK.values())}
    for rock, seed_name in SEED_FOR_ROCK.items():
        replace_region(sheet, width, regions[rock], seeds[seed_name])
    save_png(ATLAS_DIR / "anticipation.png", width, height, sheet)
    atlas_path.write_text(atlas_text.replace("anticipation.webp", "anticipation.png", 1))
    print("Updated eight rock regions in anticipation.png; Spine timelines are unchanged.")


if __name__ == "__main__":
    main()
