"""
V8e extraction:
  1. logo.png — the centered horned warrior with TITAN PRO wordmark
  2. m-halo.png — ONLY the round ring from the silver angel-warrior
                   (not the full sun-burst; the user wants the ring only,
                    positioned so it rotates perfectly)
"""
from PIL import Image
import numpy as np
from pathlib import Path

OUT = Path(r"public\mascot")
OUT.mkdir(parents=True, exist_ok=True)


def blacken_to_transparent(arr, threshold=20):
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    is_black = (r < threshold) & (g < threshold) & (b < threshold)
    out = arr.copy()
    out[..., 3] = np.where(is_black, 0, 255)
    return out


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


# --- 1. New logo (horned warrior + TITAN PRO wordmark) ---
logo_src = Path(r"C:\Users\Syahfalah\Downloads\424bbc71-ae68-4ea1-a675-cbaeba891e69.jpg")
img = Image.open(logo_src).convert("RGBA")
w, h = img.size
arr = np.array(img)
arr_t = blacken_to_transparent(arr, threshold=22)
print(f"Logo source: {logo_src.name}  {w}x{h}")
print(f"  non-transparent: {(arr_t[..., 3] > 0).sum()}")

# Tighter crop but with extra bottom room for the wordmark
tight = tight_crop(arr_t, pad=4)
Image.fromarray(tight).save(OUT / "logo.png")
print(f"  logo.png: {tight.shape[1]}x{tight.shape[0]}")


# --- 2. Round ring halo from silver angel-warrior ---
ref = Path(r"reference\Gemini_Generated_Image_vvqphevvqphevvqp.png")
candidates = [
    ref,
    Path(r"reference\Gemini_Generated_Image_vvqphevvqpvvqphevvqphevvqp.png"),
    Path(r"reference\Gemini_Generated_Image_vvqphevvqp.png"),
]
for p in candidates:
    if p.exists():
        ref = p
        break

img2 = Image.open(ref).convert("RGBA")
w2, h2 = img2.size
arr2 = np.array(img2)
arr2_t = whiten_to_transparent(arr2, threshold=235)
print(f"\nHalo source: {ref.name}  {w2}x{h2}")

# The sun-burst is at top of the silver angel-warrior. The "round ring" the
# user wants is the circular/ring shape in the middle of the burst, not the
# spiky star pattern. The burst is roughly y=0-220 in 1024 space.
# Let's look at the orange/yellow pixels specifically (they form the ring).
r, g, b, a = arr2_t[..., 0], arr2_t[..., 1], arr2_t[..., 2], arr2_t[..., 3]
# Orange/gold mask: red > 200, green 100-200, blue < 150
is_orange = (r > 200) & (g > 100) & (g < 220) & (b < 150)
ring_mask = is_orange & (a > 0)
print(f"  orange pixels: {ring_mask.sum()}")

# Create new image with only the orange ring
ring_only = np.zeros_like(arr2_t)
ring_only[..., 3] = ring_mask.astype(np.uint8) * 255
ring_only[..., 0] = r * ring_mask
ring_only[..., 1] = g * ring_mask
ring_only[..., 2] = b * ring_mask

# The ring sits in roughly y 30-220 of the original. Crop to a square
# region that contains the whole circular ring.
ring_crop = ring_only[0:230, 0:1024]
ring_tight = tight_crop(ring_crop, pad=10)
if ring_tight is not None:
    # Make sure the crop is square (so the ring is centered) by padding the
    # shorter side. This ensures the ring rotates perfectly around its center.
    h_r, w_r = ring_tight.shape[:2]
    side = max(h_r, w_r)
    square = np.zeros((side, side, 4), dtype=np.uint8)
    y_off = (side - h_r) // 2
    x_off = (side - w_r) // 2
    square[y_off:y_off + h_r, x_off:x_off + w_r] = ring_tight
    Image.fromarray(square).save(OUT / "m-halo.png")
    print(f"  m-halo.png (square): {side}x{side}")
else:
    print("  ERROR: no ring found, check threshold")

print("\nDone.")
