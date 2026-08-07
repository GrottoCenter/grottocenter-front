import * as L from 'leaflet';

// Single source of truth for the waypoint colour and pin geometry, shared by
// the pin marker and its off-screen indicator so they always stay in sync.
export const WAYPOINT_COLOR = '#E74C3C';
export const WAYPOINT_ICON_SIZE = [30, 42];
export const WAYPOINT_ICON_ANCHOR = [15, 40];

// Classic red teardrop pin (solid red, white hole) matching the requested
// mockup. Rendered as a divIcon so no asset-pipeline work is needed. The pin
// stays screen-upright on a rotated map (leaflet-rotate keeps marker icons
// screen-fixed unless rotateWithView is set), which is what we want for a pin —
// only the guidance line rotates with the view.
//
// html is a module-level static string: fine while WAYPOINT_COLOR is a single
// baked-in value. Move this to a factory function if the colour ever needs to
// follow the MUI theme (light/dark, or user preference).
const html = `
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 26 38"
     style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.45))">
  <path fill="${WAYPOINT_COLOR}" stroke="#ffffff" stroke-width="1.5"
        d="M13 1C6.4 1 1 6.4 1 13c0 8.2 12 23 12 23s12-14.8 12-23C25 6.4 19.6 1 13 1z"/>
  <circle cx="13" cy="13" r="4.8" fill="#ffffff"/>
</svg>`;

const waypointIcon = L.divIcon({
  className: '',
  html,
  iconSize: WAYPOINT_ICON_SIZE,
  // Anchor on the bottom tip so the point sits exactly on the target coordinate.
  iconAnchor: WAYPOINT_ICON_ANCHOR,
  popupAnchor: [0, -38]
});

export default waypointIcon;
