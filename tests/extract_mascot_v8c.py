"""
Extract layers for the silver angel-warrior mascot (V8c):
  1. m-body.png    — torso + legs + arms + sword (everything except wings/halo/head)
  2. m-head.png    — silver helmet only
  3. m-wings.png   — both wings (white feathers with golden tips)
  4. m-halo.png    — sun-burst halo behind the head

Image is 1024x1024 RGBA with a pure white background. We threshold white
pixels to transparent, then tight-crop each region with padding.
"""
from PIL import Image
import numpy as np
from pathlib import Path

REF = Path(r"reference\Gemini_Generated_Image_vvqphevvqpvvqphevvqphevvqp.png")
OUT = Path(r"public\mascot")
OUT.mkdir(parents=True, exist_ok=True)

# Discover actual file name
candidates = [
    Path(r"reference\Gemini_Generated_Image_vvqphevvqpvvqphevvqphevvqp.png"),
    Path(r"reference\Gemini_Generated_Image_vvqphevvqphevvqp.png"),
    Path(r"reference\Gemini_Generated_Image_vvqphevvqp.png"),
]
for p in candidates:
    if p.exists():
        REF = p
        break
print(f"Source: {REF.name}")

img = Image.open(REF).convert("RGBA")
w, h = img.size
print(f"Size: {w}x{h}")

arr = np.array(img)


def whiten_to_transparent(arr, threshold=235):
    """Convert near-white pixels to transparent (background → alpha 0)."""
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    is_white = (r > threshold) & (g > threshold) & (b > threshold)
    out = arr.copy()
    out[..., 3] = np.where(is_white, 0, 255)
    return out


def tight_crop(arr_region, pad=4):
    alpha = arr_region[..., 3]
    if alpha.sum() == 0:
        return None
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    ymin = max(0, ymin - pad)
    ymax = min(arr_region.shape[0], ymax + pad)
    xmin = max(0, xmin - pad)
    xmax = min(arr_region.shape[1], xmax + pad)
    return arr_region[ymin:ymax, xmin:xmax]


arr_t = whiten_to_transparent(arr, threshold=235)
print(f"After whitening: {(arr_t[..., 3] > 0).sum()} non-transparent px out of {w*h}")

# Approximate regions in 1024-space (verified by visual inspection):
# - Halo:    y 30-200,  x 350-690   (top center)
# - Wings:   y 60-900,  x 0-1024    (full width, both sides)
# - Head:    y 200-330, x 440-580   (the silver helmet)
# - Body:    y 280-960, x 300-720   (torso + arms + legs + sword)
#
# We crop generously then tight-crop via the alpha mask.

regions = {
    "m-wings": (0,   60,  1024, 900),
    "m-halo":  (340, 20,  690,  230),
    "m-head":  (430, 200, 600,  340),
    "m-body":  (290, 280, 740,  960),
}

for name, (x1, y1, x2, y2) in regions.items():
    crop = arr_t[y1:y2, x1:x2]
    tight = tight_crop(crop, pad=6)
    if tight is None:
        print(f"  {name}: empty, skip")
        continue
    out_path = OUT / f"{name}.png"
    Image.fromarray(tight).save(out_path)
    print(f"  {name}: {tight.shape[1]}x{tight.shape[0]} -> {out_path}")

print("Done.")
