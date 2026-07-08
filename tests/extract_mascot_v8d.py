"""
Extract layers for V8d mascot:
  1. m-full.png  — the ENTIRE silver angel-warrior as ONE image (single layer)
  2. m-halo.png  — the new golden sun-burst with stars (separate, behind mascot)

Source 1: reference\Gemini_Generated_Image_vvqphevvqphevvqp.png  (silver angel-warrior)
Source 2: halo reference (golden sun-burst)
"""
from PIL import Image
import numpy as np
from pathlib import Path

OUT = Path(r"public\mascot")
OUT.mkdir(parents=True, exist_ok=True)


def whiten_to_transparent(arr, threshold=235):
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


# --- Mascot (silver angel-warrior) — KEEP AS ONE LAYER ---
ref_mascot = Path(r"reference\Gemini_Generated_Image_vvqphevvqphevvqp.png")
candidates = [
    ref_mascot,
    Path(r"reference\Gemini_Generated_Image_vvqphevvqpvvqphevvqphevvqp.png"),
    Path(r"reference\Gemini_Generated_Image_vvqphevvqp.png"),
]
for p in candidates:
    if p.exists():
        ref_mascot = p
        break

img = Image.open(ref_mascot).convert("RGBA")
w, h = img.size
arr = np.array(img)
arr_t = whiten_to_transparent(arr, threshold=235)
print(f"Mascot source: {ref_mascot.name}  {w}x{h}")
print(f"  non-transparent: {(arr_t[..., 3] > 0).sum()}")

# Tight-crop the whole image (no per-region split)
mascot_full = tight_crop(arr_t, pad=8)
Image.fromarray(mascot_full).save(OUT / "m-full.png")
print(f"  m-full.png: {mascot_full.shape[1]}x{mascot_full.shape[0]}")


# --- Halo (golden sun-burst) ---
ref_halo = Path(r"C:\Users\Syahfalah\Downloads\images.jpg")
img2 = Image.open(ref_halo).convert("RGBA")
w2, h2 = img2.size
arr2 = np.array(img2)
arr2_t = whiten_to_transparent(arr2, threshold=235)
print(f"\nHalo source: {ref_halo.name}  {w2}x{h2}")
print(f"  non-transparent: {(arr2_t[..., 3] > 0).sum()}")

halo = tight_crop(arr2_t, pad=8)
Image.fromarray(halo).save(OUT / "m-halo.png")
print(f"  m-halo.png: {halo.shape[1]}x{halo.shape[0]}")

print("\nDone.")
