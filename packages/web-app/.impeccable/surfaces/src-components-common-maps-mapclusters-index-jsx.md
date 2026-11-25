---
version: 1
slug: 'src-components-common-maps-mapclusters-index-jsx'
primary_target: 'src/components/common/Maps/MapClusters/index.jsx'
related_targets: ['src/components/common/Maps/MapClusters/MapExportDialog.jsx']
---

# Map entrance export

Mode: Operate. Target: the existing map context menu and its export dialog.
Public trip preparation, online, covering all public entrances in captured map
bounds. On 25 November 2026 the user dropped complex filters and count preview.
GPX remains selected by default.

## Direction contract

THESIS: Make the scope of a GPS export explicit before download, including the
fact that size, data quality and interest filters are ignored.
The context action concerns the area, separated from actions on the clicked point.

OWN-WORLD: Preserve the existing MUI theme, brown primary action, system type,
semantic alerts and StandardDialog. No new visual identity or decorative assets.

STORY: Right-click or long-press; open the export dialog; read the scope notice;
choose GPX, KML or GeoJSON; download. Errors explain a recovery action.

FIRST VIEWPORT: A compact desktop dialog, fullscreen on mobile. Title, scope,
an always-visible informational alert, three labeled radio choices, then fixed
Cancel and Download actions. Download starts the first export request; loading,
empty, API limit and recoverable failure states appear inline.
On mobile the primary action comes first. Selection is captured once; cancel
prevents a late download. Use existing dialog transitions and reduced-motion rules.

FORM: seed: none (pinned). Existing dialog retained; latest user request:
“exporte tout pour le moment, sans les filtres complexes. Notifie le clairement”.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Verification

Revised on 25 November 2026 for the simplified export scope. A fresh independent
finish reviewer inspected all six current production captures: desktop, narrow
French portrait, landscape, loading, empty and error. Disposition: `ship`, scoped
to this export-dialog extension; no material fixes. The ignored-filter notice
remains visible in every state. Landscape content scrolls while actions remain
accessible. Browser assertions verify dialog buttons at 44px or larger.

The mechanical detector returned no findings. All 75 unit tests and 10 browser
scenarios pass; production build, scoped lint and translation checks pass.
Existing MUI typography, semantic alerts, brown primary actions and dialog
behavior were compared against the incumbent implementation and preserved.
No replacement visual world, design tokens or shipping raster was introduced;
`DESIGN.md` was absent before this extension and no system change requires one.

See `docs/plans/map-entrance-export-1458.md` at repository root for validation
commands, API checks and the remaining real-device/GPS-application qualification.
