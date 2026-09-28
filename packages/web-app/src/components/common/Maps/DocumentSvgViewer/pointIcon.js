import { divIcon } from 'leaflet';

const MARKER_SIZE = 32;

// MUI PlaceIcon (LocationOn) — teardrop pin with a central dot: reads as a
// "place/point" rather than a document.
const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

const renderBadge = (color, count) =>
  `<circle cx="20" cy="3" r="6" fill="${color}"/>` +
  `<text x="20" y="5.5" font-family="system-ui,sans-serif" font-size="7"` +
  ` font-weight="700" text-anchor="middle" fill="#fff">${count}</text>`;

const renderMarker = (color, badgeColor, count) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}"` +
  ` viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));overflow:visible">` +
  `<path fill="${color}" stroke="#fff" stroke-width="1" stroke-linejoin="round" d="${PIN_PATH}"/>` +
  `<circle cx="12" cy="9" r="2.5" fill="#fff"/>` +
  (count > 0 ? renderBadge(badgeColor, count) : '') +
  `</svg>`;

// Raw SVG markup of the marker, so the same icon can be reused outside Leaflet
// (e.g. in a menu item).
export const pointIconHtml = ({ color, badgeColor = color, count = 0 }) =>
  renderMarker(color, badgeColor, count);

export const makePointIcon = opts =>
  divIcon({
    className: 'topo-point-marker',
    html: pointIconHtml(opts),
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE - 3]
  });
