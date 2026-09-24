// Shared geometry for the SVG viewer's Leaflet controls and overlays.
// Kept in one place so the popup auto-pan padding can be derived from the same
// values the top-left control column is actually sized with.

// Side length (px) of the square map-control buttons (fit-bounds, points
// toggle…) stacked in the top-left column.
export const MAP_CONTROL_BUTTON_SIZE = 30;

// Leaflet's default margin (px) between a control and the map edge
// (`.leaflet-control` has `margin: 10px`).
export const LEAFLET_CONTROL_MARGIN = 10;
