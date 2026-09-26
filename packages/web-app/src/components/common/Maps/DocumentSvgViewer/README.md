# DocumentSvgViewer — SVG conventions

Tiled SVG viewer (Leaflet) for document `.svg` files: crisp rendering with smooth
zoom/pan, plus clickable **points** placed on the drawing that link to other
documents.

This document describes **what an SVG must contain** to carry points.

> ⚠️ This is a **GrottoCenter-specific** convention. It is not an Inkscape,
> Therion or any other standard — those tools have no notion of control points
> inside the SVG, so the points must be added by hand (once).

---

## Control points (required to have points)

An SVG that wants to carry points must define **3 control points** in a
`#control-points` group, with the ids `#control-1`, `#control-2`, `#control-3`:

```xml
<g id="control-points" style="display:none">
  <circle id="control-1" cx="1200" cy="5000" r="30"/>
  <circle id="control-2" cx="3600" cy="5000" r="30"/>
  <circle id="control-3" cx="1200" cy="1400" r="30"/>
</g>
```

Rules:

- **Exactly 3** points, with ids `control-1/2/3`.
- Position read from `cx`/`cy` (circle) or `x`/`y` (any other element).
- **Not collinear** (they must form a real triangle).
- Place them on **stable, identifiable** features of the drawing, well
  **spread out** (covering the drawing widely improves accuracy).
- The group is **removed before rendering**: set `style="display:none"`; it will
  not be shown regardless.

If the group is missing or incomplete, the SVG still renders normally but the
**points are not placed** (a warning is logged to the console).

### Adding them in Inkscape

Draw 3 small circles → for each one, *Object Properties* (Ctrl+Shift+O) → set the
**ID** field to `control-1`, `control-2`, `control-3`. Group them (Ctrl+G) and
give the group the ID `control-points`.

---

## Why control points?

Points are **not** stored in the SVG: they are defined on the application side,
in coordinates **relative to the 3 control points** (an affine frame). As long
as the control points follow the drawing, the points stay in the right place even
if the SVG is **re-edited or re-exported** (translation, rotation, scale change).
This is **control-point georeferencing**: 3 points cover the general affine case.

Frame used:

- `control-1` → `(0, 0)` (origin)
- `control-2` → `(1, 0)` (u axis)
- `control-3` → `(0, 1)` (v axis)

A point with coordinates `[u, v]` is placed at
`svg = P1 + u·(P2−P1) + v·(P3−P1)`.

---

## Application-side data shape

The viewer receives points through the `points` prop (see `index.jsx`). The
`coordinates` are in the frame above, **not** raw SVG coordinates:

```js
<DocumentSvgViewer
  svgUrl={fileUrl}
  points={[
    {
      id: 'siphon-boue',
      coordinates: [0.4625, 0.4583], // [u, v] in the control-point frame
      label: 'Siphon de la boue',    // optional popup header
      documents: [
        { id: 'a1', documentId: 234115, label: 'CR explo 2020' },
        { id: 'a2', documentId: 234116, label: 'CR explo 2022' }
      ]
    }
  ]}
/>
```

Example: the dedicated page `src/pages/Topo.jsx` (route `/ui/topo`, wired to
`public/la-grande-topo.svg`).

### Creating points from the viewer

When the SVG has control points, **right-click** on the drawing opens a small menu
→ *Create a point here* → a dialog asks for a name and optional document ids. The
click position is converted to frame coordinates and the point is added to the
viewer. This has **no backend yet**: created points are a temporary mock,
persisted in `localStorage` keyed by the SVG url (`useMockPoints.js`). See
`CreatePointDialog.jsx`. Replace with a real API when available.

---

## Files

| File | Role |
| --- | --- |
| `index.jsx` | `DocumentSvgViewer` component (Leaflet map + points) |
| `SvgTileLayer.js` (parent) | SVG load/parse, tiled rendering, control-point reading |
| `georef.js` | affine frame from the 3 control points (`frame ↔ SVG`) |
| `PointMarker.jsx` | a point's marker + popup of linked documents |
| `pointIcon.js` | marker icon |
