import { blue, brown } from '@mui/material/colors';

export const CAVE_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

// Circle marker styles per cave size category (radius in px, colors from brown palette).
const CAVE_SIZE_STYLE = {
  [CAVE_SIZE.SMALL]: {
    radius: 6,
    color: brown[700],
    weight: 1,
    fillColor: brown[400],
    fillOpacity: 0.85
  },
  [CAVE_SIZE.MEDIUM]: {
    radius: 10,
    color: brown[900],
    weight: 1,
    fillColor: brown[700],
    fillOpacity: 0.85
  },
  [CAVE_SIZE.LARGE]: {
    radius: 14,
    color: brown[900],
    weight: 1,
    fillColor: brown[900],
    fillOpacity: 0.85
  }
};

export const getCaveSize = entrance => {
  const depth = entrance.depth ?? 0;
  const length = entrance.length ?? 0;
  // Define thresholds for cave size categories based on depth and length.
  if (depth >= 100 || length >= 1000) return CAVE_SIZE.LARGE;
  if (depth >= 30 || length >= 200) return CAVE_SIZE.MEDIUM;
  return CAVE_SIZE.SMALL;
};

export const getEntranceCircleStyle = entrance =>
  CAVE_SIZE_STYLE[getCaveSize(entrance)];

export const MARKERS_LIMIT = 13;

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
export const HEX_LAYER_OPTIONS = {
  radius: HEX_MAX_RADIUS,
  opacity: HEX_OPACITY,
  duration: 400
};

// For visibility we changes the options on
export const HEX_DETAILS_OPACITY = 0.85;
export const HEX_DETAILS_ZOOM = 8;
const HEX_DETAILS_MIN_RADIUS = 10;
export const HEX_DETAILS_RADIUS_RANGE = [
  HEX_DETAILS_MIN_RADIUS,
  HEX_MAX_RADIUS
];
