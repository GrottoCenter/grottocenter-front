import { divIcon } from 'leaflet';

const MARKER_SIZE = 32;

const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';
const ICON_PATH =
  'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z';

const renderBadge = (color, count) =>
  `<circle cx="20" cy="3" r="6" fill="${color}"/>` +
  `<text x="20" y="5.5" font-family="system-ui,sans-serif" font-size="7"` +
  ` font-weight="700" text-anchor="middle" fill="#fff">${count}</text>`;

const renderMarker = (color, badgeColor, count) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}"` +
  ` viewBox="0 0 24 24" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));overflow:visible">` +
  `<path fill="${color}" stroke="#fff" stroke-width="1" stroke-linejoin="round" d="${PIN_PATH}"/>` +
  `<g transform="translate(7 4)">` +
  `<path fill="#fff" transform="scale(0.417)" d="${ICON_PATH}"/>` +
  `</g>` +
  (count > 0 ? renderBadge(badgeColor, count) : '') +
  `</svg>`;

export const makePointIcon = ({ color, badgeColor = color, count = 0 }) =>
  divIcon({
    className: 'topo-point-marker',
    html: renderMarker(color, badgeColor, count),
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE - 3]
  });
