# Grottocenter Icon Spec

All application icons in this directory share a common visual language. Follow this spec when creating or modifying icons.

---

## Canvas

| Property          | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| Width             | `100` px (some older icons export at ~106 px - use 100) |
| Height            | `100` px                                                |
| Coordinate system | User-space, origin top-left                             |

---

## Layer Structure (bottom → top)

```text
1. <defs>        gradient + blur filter definitions
2. Shadow path   soft drop-shadow rendered as a blurred radial-gradient path
3. Card          brown rounded-rectangle background
4. Pictogram     white primary shape + orange accent
```

---

## 1. Definitions (`<defs>`)

### Linear gradient (base color for shadow)

```xml
<linearGradient id="a">
  <stop offset="0" stop-color="#666"/>
  <stop offset="1" stop-color="#666" stop-opacity="0"/>
</linearGradient>
```

### Radial gradient (shadow shape)

References `#a`. The `gradientTransform` matrix is pre-baked and identical across all square icons - copy it verbatim:

```xml
<radialGradient xlink:href="#a" id="b"
  cx="-1380.014" cy="14.258"
  fx="-1380.014" fy="14.258"
  r="286.189"
  gradientTransform="matrix(-.0124 1.41624 -1.50853 -.01321 -604.363 2011.032)"
  gradientUnits="userSpaceOnUse"/>
```

### Blur filter (shadow softness)

```xml
<filter id="c" x="-.012" width="1.024" y="-.012" height="1.024"
        color-interpolation-filters="sRGB">
  <feGaussianBlur stdDeviation="2.86"/>
</filter>
```

---

## 2. Shadow

A large pre-transformed rectangle path rendered with `fill="url(#b)"` and `filter="url(#c)"`. This creates a soft oval shadow beneath the card. Copy the path and transform verbatim:

```xml
<path
  d="M-853.53 340.161c-11.298-4.008-26.824-17.474-33.734-29.256l-7.657-13.057-.02-240
     c-.01-132 .965-243.513 2.166-247.805 3.03-10.83 18.021-27.17 31.003-33.792
     10.507-5.36 18.95-5.546 252.064-5.546 265.073 0 252.019-.855 269.406 17.633
     17.736 18.86 16.698 4.734 17.607 239.51.46 118.642-.303 230.206-1.695 247.92
     -2.317 29.504-3.24 33.099-11 42.857-4.66 5.858-14.134 13.544-21.054 17.08
     l-12.583 6.428-240.109-.225c-132.06-.124-242.037-.91-244.395-1.747z"
  transform="matrix(.16042 0 0 .16155 150.64 43.625)"
  opacity=".93"
  fill="url(#b)"
  filter="url(#c)"/>
```

---

## 3. Card

A rounded rectangle that fills most of the canvas, leaving a visible shadow margin. Color: **`#5d4037`** (Material Design Brown 700).

Effective area (approximate): x 2-91, y 7-94 → inner safe zone for pictogram: x 10-90, y 12-90.

Copy the card path verbatim:

```xml
<path
  d="M8.252 93.608c-1.812-.648-4.303-2.823-5.412-4.726l-1.228-2.11L1.609 48
     c-.002-21.324.155-39.34.347-40.033.486-1.75 2.891-4.389 4.974-5.459
     1.685-.866 3.04-.896 40.435-.896 42.523 0 40.429-.138 43.218 2.849
     2.845 3.047 2.679.765 2.824 38.693.074 19.166-.048 37.19-.271 40.051
     -.372 4.767-.52 5.347-1.765 6.924-.748.946-2.267 2.188-3.378 2.759
     l-2.018 1.038-38.518-.036c-21.185-.02-38.827-.147-39.205-.282z"
  fill="#5d4037"/>
```

---

## 4. Pictogram

### Colors

| Role          | Hex       | Usage                                                         |
| ------------- | --------- | ------------------------------------------------------------- |
| Primary shape | `#ffffff` | Main recognizable silhouette                                  |
| Accent        | `#f57c00` | Secondary highlight element (arrow tip, circle, lamp, etc.)   |
| Rare accent   | `#ffff00` | Occasionally used for glowing/light detail (torch, lamp beam) |
| Rare accent   | `#059865` | Used only for the network/cave-system icon                    |

### Rules

- **White first**: the primary pictogram is always white. Draw the main concept as a white filled shape.
- **Orange accent**: one small, meaningful sub-element (tip, dot, hole, direction indicator) is orange. Keep it subordinate in size.
- **Stroke**: use `stroke-linecap="round"` when strokes are used. Stroke color is white or orange, never the card color.
- **Placement**: center the pictogram relative to the **brown card**, not the full 100×100 canvas. The card does not fill the canvas - it leaves a shadow margin on all sides. The card's bounding box is approximately x 1.6-93.4, y 1.6-93.9, so its visual center is **(47.5, 47.8)**, not (50, 50). Leave ≥ 8 px margin from card edges.
- **Scale**: pictogram should fill roughly 65-75% of the card width.
- **No outlines on card**: the card shape has no border/stroke.
- **No `<circle>` or `<rect>` primitives**: prefer `<path>` only (Inkscape-style output), so the file stays consistent with existing icons.

---

## Adapting a MUI Icon

MUI icons ship as 24×24 `<path>` data. Follow these steps to turn any of them into a Grottocenter card icon.

### Step 1 - find the raw path

**Always read the path from the installed package** - never rely on memory or online sources, as the path can differ between MUI versions:

```bash
cat packages/web-app/node_modules/@mui/icons-material/GpsFixed.js
```

The `d` attribute of the inner `<path>` is what you need. The file is small and the `d` string is always on the line containing `"d:"`.

Fallback: inspect the rendered icon in browser DevTools and copy the `d` attribute directly.

### Step 2 - split into color layers

MUI paths often encode multiple subpaths in a single `d` string, separated by `M`/`m` commands. Identify which subpath corresponds to:

- The **accent** element (small dot, tip, highlight) → will become **orange `#f57c00`**
- Everything else → will become **white `#fff`**

Each subpath is independent once you make the `m` (relative move) absolute. To convert a relative `m dx dy` at the start of a subpath to absolute `M X Y`, add its offsets to the **start point of the previous subpath's `M`** (not the end point - after a `z` the current point resets to the last `M`).

Example from `GpsFixed`:

- Original: `M12 8 … z` + `m8.94 3 …` + `M12 19 …`
- The `z` resets to `(12, 8)`, so `m8.94 3` → `M 20.94 11`
- Result: two separate `d` strings, one per `<path>`

### Step 3 - scale and center

The MUI viewBox is `0 0 24 24`, center at `(12, 12)`.
The card's visual center is **(47.5, 47.8)** - not the canvas center (50, 50) (see Placement rule above).

**Scale factor**: `76 / 24 = 3.1667` (fills ~76 px of the card's ~92 px height)
**Offset**: `47.5 - 12 × 3.1667 ≈ 9.5` (x) and `47.8 - 12 × 3.1667 ≈ 9.8` (y)

Apply to both pictogram paths:

```xml
transform="matrix(3.1667 0 0 3.1667 9.5 9.8)"
```

Verify: source center `(12, 12)` → `(12×3.1667 + 9.5, 12×3.1667 + 9.8)` = `(47.5, 47.8)` ✓

### Step 4 - assemble

Drop the two scaled paths into the template below (white first, orange on top):

```xml
<!-- White: main shape -->
<path d="… ring + ticks …"
      transform="matrix(3.1667 0 0 3.1667 9.5 9.8)" fill="#fff"/>

<!-- Orange: accent detail -->
<path d="… center dot …"
      transform="matrix(3.1667 0 0 3.1667 9.5 9.8)" fill="#f57c00"/>
```

### Example - `GpsFixed`

Original MUI path (single string):

```text
M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z
m8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2
  h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z
M12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z
```

Split result:

```xml
<!-- White: ring + ticks (m converted to M20.94 11) -->
<path d="M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
      transform="matrix(3.1667 0 0 3.1667 9.5 9.8)" fill="#fff"/>

<!-- Orange: center dot -->
<path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"
      transform="matrix(3.1667 0 0 3.1667 9.5 9.8)" fill="#f57c00"/>
```

---

## Template

Use this as a starting point for any new icon. Replace everything inside the `<!-- PICTOGRAM -->` comment block:

```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="100" height="100">
  <defs>
    <radialGradient xlink:href="#a" id="b"
      cx="-1380.014" cy="14.258" fx="-1380.014" fy="14.258" r="286.189"
      gradientTransform="matrix(-.0124 1.41624 -1.50853 -.01321 -604.363 2011.032)"
      gradientUnits="userSpaceOnUse"/>
    <linearGradient id="a">
      <stop offset="0" stop-color="#666"/>
      <stop offset="1" stop-color="#666" stop-opacity="0"/>
    </linearGradient>
    <filter id="c" x="-.012" width="1.024" y="-.012" height="1.024"
            color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="2.86"/>
    </filter>
  </defs>

  <!-- Shadow -->
  <path d="M-853.53 340.161c-11.298-4.008-26.824-17.474-33.734-29.256l-7.657-13.057
           -.02-240c-.01-132 .965-243.513 2.166-247.805 3.03-10.83 18.021-27.17
           31.003-33.792 10.507-5.36 18.95-5.546 252.064-5.546 265.073 0 252.019-.855
           269.406 17.633 17.736 18.86 16.698 4.734 17.607 239.51.46 118.642-.303
           230.206-1.695 247.92-2.317 29.504-3.24 33.099-11 42.857-4.66 5.858
           -14.134 13.544-21.054 17.08l-12.583 6.428-240.109-.225
           c-132.06-.124-242.037-.91-244.395-1.747z"
        transform="matrix(.16042 0 0 .16155 150.64 43.625)"
        opacity=".93" fill="url(#b)" filter="url(#c)"/>

  <!-- Card -->
  <path d="M8.252 93.608c-1.812-.648-4.303-2.823-5.412-4.726l-1.228-2.11L1.609 48
           c-.002-21.324.155-39.34.347-40.033.486-1.75 2.891-4.389 4.974-5.459
           1.685-.866 3.04-.896 40.435-.896 42.523 0 40.429-.138 43.218 2.849
           2.845 3.047 2.679.765 2.824 38.693.074 19.166-.048 37.19-.271 40.051
           -.372 4.767-.52 5.347-1.765 6.924-.748.946-2.267 2.188-3.378 2.759
           l-2.018 1.038-38.518-.036c-21.185-.02-38.827-.147-39.205-.282z"
        fill="#5d4037"/>

  <!-- PICTOGRAM: replace the paths below -->
  <path fill="#fff" d="..."/>
  <path fill="#f57c00" d="..."/>
</svg>
```
