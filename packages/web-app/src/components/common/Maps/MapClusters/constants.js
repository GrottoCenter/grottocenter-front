import { blue, brown, green } from '@mui/material/colors';

export const CAVE_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Circle marker styles per cave size category (radius in px).
// White stroke ensures contrast on all tile layers (light OSM, satellite, dark).
export const CAVE_SIZE_STYLE = {
  [CAVE_SIZE.SMALL]: {
    radius: 6,
    color: '#FFFFFF',
    weight: 1,
    fillColor: '#8D6E63',
    fillOpacity: 0.9
  },
  [CAVE_SIZE.MEDIUM]: {
    radius: 10,
    color: '#FFFFFF',
    weight: 1,
    fillColor: '#E07835',
    fillOpacity: 0.9
  },
  [CAVE_SIZE.LARGE]: {
    radius: 14,
    color: '#FFFFFF',
    weight: 1,
    fillColor: '#C62828',
    fillOpacity: 0.9
  }
};

export const CAVE_SIZE_THRESHOLDS = {
  LARGE: { depth: 100, length: 1000 },
  MEDIUM: { depth: 30, length: 200 }
};

export const getCaveSize = entrance => {
  const depth = entrance.depth ?? 0;
  const length = entrance.length ?? 0;
  if (
    depth >= CAVE_SIZE_THRESHOLDS.LARGE.depth ||
    length >= CAVE_SIZE_THRESHOLDS.LARGE.length
  )
    return CAVE_SIZE.LARGE;
  if (
    depth >= CAVE_SIZE_THRESHOLDS.MEDIUM.depth ||
    length >= CAVE_SIZE_THRESHOLDS.MEDIUM.length
  )
    return CAVE_SIZE.MEDIUM;
  return CAVE_SIZE.SMALL;
};

export const getEntranceCircleStyle = entrance =>
  CAVE_SIZE_STYLE[getCaveSize(entrance)];

export const ENTRANCE_MARKER_FILTERS = [
  { id: CAVE_SIZE.SMALL, labelKey: 'Small caves' },
  { id: CAVE_SIZE.MEDIUM, labelKey: 'Medium caves' },
  { id: CAVE_SIZE.LARGE, labelKey: 'Large caves' }
];

export const MARKERS_LIMIT = 13;
// Zoom level at which massif polygons are fetched and displayed
export const MASSIFS_POLYGON_LIMIT = 8;

// Related to Heat map
const HEX_MIN_RADIUS = 10;
export const HEX_OPACITY = 0.75;
export const HEX_MAX_RADIUS = 14;
export const HEX_FLY_TO_DURATION = 1;
export const HEX_RADIUS_RANGE = [HEX_MIN_RADIUS, HEX_MAX_RADIUS];
// Start at [200] to avoid near-white shades that disappear
// on light OSM tiles, especially combined with the hex opacity.
export const ENTRANCE_HEAT_COLORS = [brown[200], brown[900]];
export const NETWORK_HEAT_COLORS = [blue[200], blue[900]];
export const MASSIF_HEAT_COLORS = [green[200], green[900]];

// Massif polygon style for the Leaflet GeoJSON layer
export const MASSIF_POLYGON_STYLE = {
  color: green[700],
  weight: 2,
  opacity: 0.85,
  fillColor: green[400],
  fillOpacity: 0.25
};
export const MASSIF_POLYGON_HOVER_STYLE = {
  weight: 3,
  fillOpacity: 0.45
};
export const HEX_LAYER_OPTIONS = {
  radius: HEX_MAX_RADIUS,
  opacity: HEX_OPACITY,
  duration: 400
};

// Per-type zoom threshold above which the heatmap is replaced by another layer
// (point markers for entrances/networks, polygons for massifs).
export const HEAT_TYPE_CONFIG = {
  entrances: { heatOffZoom: MARKERS_LIMIT },
  networks: { heatOffZoom: MARKERS_LIMIT },
  massifs: { heatOffZoom: MASSIFS_POLYGON_LIMIT }
};
export const getHeatOffZoom = type =>
  HEAT_TYPE_CONFIG[type]?.heatOffZoom ?? MARKERS_LIMIT;

// For visibility we changes the options on
export const HEX_DETAILS_OPACITY = 0.85;
export const HEX_DETAILS_ZOOM = 8;
const HEX_DETAILS_MIN_RADIUS = 10;
export const HEX_DETAILS_RADIUS_RANGE = [
  HEX_DETAILS_MIN_RADIUS,
  HEX_MAX_RADIUS
];
