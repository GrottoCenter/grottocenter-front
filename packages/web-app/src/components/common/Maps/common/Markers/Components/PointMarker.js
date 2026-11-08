import L from 'leaflet';
import { MAP_PIN_PATH } from '@/components/common/Maps/common/mapPin';
import {
  MAP_MARKER_OUTLINE_COLOR,
  MAP_MARKER_OUTLINE_WIDTH
} from '@/components/common/Maps/common/mapMarkerOutline';

export const PointMarker = L.divIcon({
  className: 'point-marker',
  html: `<svg data-testid="point-map-marker" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 28" width="20" height="28">
    <path d="${MAP_PIN_PATH}" fill="#7b1fa2" stroke="${MAP_MARKER_OUTLINE_COLOR}" stroke-width="${MAP_MARKER_OUTLINE_WIDTH}"/>
    <circle cx="10" cy="8" r="3" fill="#fff"/>
  </svg>`,
  iconSize: [20, 28],
  iconAnchor: [10, 28],
  tooltipAnchor: [12, -20]
});

export const shouldReplacePointMarker = (previous, next) =>
  ['label', 'latitude', 'longitude', 'city', 'region', 'country'].some(
    field => previous[field] !== next[field]
  );
