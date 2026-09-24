import { divIcon } from 'leaflet';

const PIN_SIZE = 32;
const ICON_SIZE = 18;
const BADGE_SIZE = 18;
const PIN_SVG_PATH =
  'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z';

const renderBadge = (color, count) =>
  `<div style="` +
  `position:absolute;top:-4px;right:-4px;` +
  `min-width:${BADGE_SIZE}px;height:${BADGE_SIZE}px;padding:0 5px;` +
  `box-sizing:border-box;background:${color};color:#fff;` +
  `border-radius:${BADGE_SIZE / 2}px;` +
  'font:600 11px/1 system-ui,sans-serif;' +
  'display:flex;align-items:center;justify-content:center;' +
  'box-shadow:0 1px 2px rgba(0,0,0,.3);' +
  `">${count}</div>`;

const renderIconHtml = (color, badgeColor, count) =>
  `<div style="position:relative;width:${PIN_SIZE}px;height:${PIN_SIZE}px;">` +
  `<div style="width:${PIN_SIZE}px;height:${PIN_SIZE}px;border-radius:50%;` +
  `background:${color};color:#fff;display:flex;align-items:center;justify-content:center;` +
  'border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);' +
  'transition:transform .15s ease;">' +
  `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" ` +
  'fill="currentColor" aria-hidden="true" focusable="false">' +
  `<path d="${PIN_SVG_PATH}"/></svg></div>` +
  (count > 0 ? renderBadge(badgeColor, count) : '') +
  '</div>';

export const makePinIcon = ({ color, badgeColor = color, count = 0 }) =>
  divIcon({
    className: 'topo-anchor-pin',
    html: renderIconHtml(color, badgeColor, count),
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2]
  });
