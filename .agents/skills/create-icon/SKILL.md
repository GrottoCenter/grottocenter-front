---
name: create-icon
description: Create a new SVG icon for the GrottoCenter icon system from an MUI icon, following the brown-card style used by all other icons in src/assets/icons/.
argument-hint: "<slug> <MuiIconName> [accent-element-hint]"
---

You are creating a new icon for the GrottoCenter icon system. All icons share the same visual style: a 100×100 SVG with a brown rounded card (`#5d4037`), shadow, and white icon content with an optional orange accent (`#f57c00`).

`$ARGUMENTS` format: `<slug> <MuiIconName> [accent-element-hint]`
- `slug`: kebab-case filename without extension (e.g. `scientific-observation`)
- `MuiIconName`: exact JS file name in `@mui/icons-material/` (e.g. `Biotech`, `WaterDrop`)
- `accent-element-hint` (optional): which element should be orange instead of white (e.g. `circle`, `second-path`)

---

## Phase 1 — Extract the MUI icon paths

Run:
```bash
node -e "
const fs = require('fs');
const f = 'node_modules/@mui/icons-material/<MuiIconName>.js';
console.log(fs.readFileSync(f, 'utf8'));
"
```

Parse the output to collect every SVG element the icon uses: `path` (d attribute), `circle` (cx/cy/r), `rect`, `polygon`, etc. There may be multiple elements — list them all with their attributes.

---

## Phase 2 — Estimate the bounding box

For simple paths and primitives (circles, rects), compute bounds exactly.
For complex cubic-bezier paths, estimate from the key coordinates visible in the `d` string (M/L/H/V endpoints and C/S anchor points — control points rarely extend beyond anchors for these icons).

Identify:
- `x_min`, `x_max` → content width in the 24×24 MUI grid
- `y_min`, `y_max` → content height
- `center_x = (x_min + x_max) / 2`
- `center_y = (y_min + y_max) / 2`

---

## Phase 3 — Choose scale and translation

The usable card area is roughly 80×80 within the 100×100 SVG (accounting for card border-radius and shadow). Target: fill 75–85% of the card height or width, whichever is the limiting dimension.

```
content_w = x_max - x_min
content_h = y_max - y_min
scale = min(80 / content_w, 80 / content_h) * 0.9   ← 90% fill factor
tx = 50 - center_x * scale
ty = 50 - center_y * scale
```

Round to 1 decimal. Verify that the largest extent stays within [5, 95].

If the icon is the same size as a standard 24×24 MUI icon (content fills ~20×20), the standard transform `matrix(3.1667 0 0 3.1667 9.5 9.8)` is a good starting point.

---

## Phase 4 — Assign colors

- **White (`#fff`)**: main structural elements (body, outline, frame)
- **Orange (`#f57c00`)**: one accent element that represents the icon's key concept (a lens, a flame, a drop, a highlight). If no natural accent exists, keep everything white.
- If the accent-element-hint from `$ARGUMENTS` is set, apply orange to that element.

---

## Phase 5 — Write the SVG

Create `packages/web-app/src/assets/icons/<slug>.svg` using this exact template (replace the icon elements section):

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100">
  <defs>
    <radialGradient xlink:href="#a" id="b"
      cx="-1380.014" cy="14.258" fx="-1380.014" fy="14.258" r="286.189"
      gradientTransform="matrix(-.0124 1.41624 -1.50853 -.01321 -604.363 2011.032)"
      gradientUnits="userSpaceOnUse"/>
    <linearGradient id="a">
      <stop offset="0" stop-color="#666"/>
      <stop offset="1" stop-color="#666" stop-opacity="0"/>
    </linearGradient>
    <filter id="c" x="-.012" width="1.024" y="-.012" height="1.024" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="2.86"/>
    </filter>
  </defs>

  <!-- Shadow -->
  <path d="M-853.53 340.161c-11.298-4.008-26.824-17.474-33.734-29.256l-7.657-13.057-.02-240c-.01-132 .965-243.513 2.166-247.805 3.03-10.83 18.021-27.17 31.003-33.792 10.507-5.36 18.95-5.546 252.064-5.546 265.073 0 252.019-.855 269.406 17.633 17.736 18.86 16.698 4.734 17.607 239.51.46 118.642-.303 230.206-1.695 247.92-2.317 29.504-3.24 33.099-11 42.857-4.66 5.858-14.134 13.544-21.054 17.08l-12.583 6.428-240.109-.225c-132.06-.124-242.037-.91-244.395-1.747z"
        transform="matrix(.16042 0 0 .16155 150.64 43.625)" opacity=".93" fill="url(#b)" filter="url(#c)"/>

  <!-- Card -->
  <path d="M8.252 93.608c-1.812-.648-4.303-2.823-5.412-4.726l-1.228-2.11L1.609 48c-.002-21.324.155-39.34.347-40.033.486-1.75 2.891-4.389 4.974-5.459 1.685-.866 3.04-.896 40.435-.896 42.523 0 40.429-.138 43.218 2.849 2.845 3.047 2.679.765 2.824 38.693.074 19.166-.048 37.19-.271 40.051-.372 4.767-.52 5.347-1.765 6.924-.748.946-2.267 2.188-3.378 2.759l-2.018 1.038-38.518-.036c-21.185-.02-38.827-.147-39.205-.282z"
        fill="#5d4037"/>

  <!-- === ICON ELEMENTS (replace this block) === -->
  <path d="..." transform="matrix(<scale> 0 0 <scale> <tx> <ty>)" fill="#fff"/>
  <!-- additional paths, circles, rects as needed -->
</svg>
```

---

## Phase 6 — Register the icon

**1. Add the export to `packages/web-app/src/assets/icons/index.js`** (alphabetical order):
```js
export { default as <camelCase>Icon } from './<slug>.svg';
```

**2. Add the import and entries to `packages/web-app/src/components/common/CustomIcon/index.jsx`**:
- Import line (alphabetical in the import block)
- Entry in `iconSources` (kebab_case key → camelCase icon)
- Entry in `altTexts` (same key → human-readable string)

**3. Update the consumer** (component or config that will use the new icon) — set `iconType: '<key>'`.

---

## Phase 7 — Visual check reminder

Remind the user to open the SVG in a browser or the IDE preview to verify:
- Icon is visually centered in the card
- White and orange elements are clearly legible on the brown background
- Scale feels consistent with other icons (temperature.svg and bibliography.svg are good references)

If the user reports centering issues, revisit Phase 2–3: re-examine the bounding box, especially `h`/`v` absolute commands and the extent of cubic bezier endpoints.
