import { blue, green } from '@mui/material/colors';
import {
  CAVE_SIZE,
  getCaveSize,
  CAVE_QUALITY
} from '@/utils/entranceMapFilters';
import {
  MAP_MARKER_OUTLINE_COLOR,
  MAP_MARKER_OUTLINE_WIDTH
} from '../common/mapMarkerOutline';
import {
  DATA_QUALITY_LABEL_KEYS,
  DATA_QUALITY_THRESHOLDS
} from '../../../../utils/dataQuality';

export { CAVE_SIZE, getCaveSize, CAVE_QUALITY };
export {
  CAVE_SIZE_THRESHOLDS,
  getCaveQuality,
  DEFAULT_ENTRANCE_FILTERS,
  DEFAULT_QUALITY_FILTERS,
  DEFAULT_MIN_INTEREST
} from '@/utils/entranceMapFilters';

// Circle marker styles per cave size category (radius in px).
// Hardcoded hex instead of brown[] palette — the palette shades (brown[400/700/900])
// are too close together to be distinguishable at a glance; these values span a wider
// lightness range. White stroke ensures contrast on all tile layers (OSM, satellite, dark).
export const CAVE_SIZE_STYLE = {
  [CAVE_SIZE.SMALL]: {
    radius: 8,
    color: MAP_MARKER_OUTLINE_COLOR,
    weight: MAP_MARKER_OUTLINE_WIDTH,
    fillColor: '#D2691E',
    fillOpacity: 0.9
  },
  [CAVE_SIZE.MEDIUM]: {
    radius: 11,
    color: MAP_MARKER_OUTLINE_COLOR,
    weight: MAP_MARKER_OUTLINE_WIDTH,
    fillColor: '#8B4513',
    fillOpacity: 0.9
  },
  [CAVE_SIZE.LARGE]: {
    radius: 15,
    color: MAP_MARKER_OUTLINE_COLOR,
    weight: MAP_MARKER_OUTLINE_WIDTH,
    fillColor: '#2C0F00',
    fillOpacity: 0.9
  }
};

export const getEntranceCircleStyle = entrance =>
  CAVE_SIZE_STYLE[getCaveSize(entrance)];

export const ENTRANCE_MARKER_FILTERS = [
  { id: CAVE_SIZE.SMALL, labelKey: 'Small caves' },
  { id: CAVE_SIZE.MEDIUM, labelKey: 'Medium caves' },
  { id: CAVE_SIZE.LARGE, labelKey: 'Large caves' }
];

// Minimum score for each category — shown in the filter UI dot (0 for insufficient).
export const CAVE_QUALITY_BADGE_VALUE = {
  [CAVE_QUALITY.GOOD]: DATA_QUALITY_THRESHOLDS.GOOD,
  [CAVE_QUALITY.SATISFACTORY]: DATA_QUALITY_THRESHOLDS.SATISFACTORY,
  [CAVE_QUALITY.INSUFFICIENT]: 0
};

export const ENTRANCE_QUALITY_FILTERS = [
  CAVE_QUALITY.INSUFFICIENT,
  CAVE_QUALITY.SATISFACTORY,
  CAVE_QUALITY.GOOD
].map(id => ({ id, labelKey: DATA_QUALITY_LABEL_KEYS[id] }));

// Interest filter — the backend `aestheticism` field is a 0–10 average, but
// the app always displays it as N/5 with the MUI Rating component (see
// Entry/Ratings.jsx and the api PR #1825 review note). The filter picks a
// minimum on the 1★–5★ scale and stores it on the same 0–10 scale as the
// backend value. The filter compares displayed star levels after rounding.
export const MARKERS_LIMIT = 13;
// Zoom level at which massif polygons are fetched and displayed
export const MASSIFS_POLYGON_LIMIT = 8;

// Network highlight overlay — revealed on hover/tap of a network marker to show
// which entrances belong to it, even when the entrances layer is hidden.
//
// Visual hierarchy (strongest → faintest): highlighted entrances > spokes > hull.
// Blue is the network semantic in this app (networks heatmap), so the surfaced
// entrances read as "this network's entrances" and stand out from brown caves.
export const NETWORK_HIGHLIGHT_ACCENT = blue[700];
// Blue hull recedes to the background — it only conveys rough footprint.
export const NETWORK_HULL_STYLE = {
  color: NETWORK_HIGHLIGHT_ACCENT,
  weight: 1,
  opacity: 0.6,
  fillColor: NETWORK_HIGHLIGHT_ACCENT,
  fillOpacity: 0.06,
  dashArray: '4 4',
  interactive: false
};
export const NETWORK_SPOKE_STYLE = {
  color: NETWORK_HIGHLIGHT_ACCENT,
  weight: 1.5,
  opacity: 0.65,
  interactive: false
};
// Ghost entrances are drawn as two stacked circles: a translucent halo for the
// "glow", then a solid white-ringed core so they pop against brown/orange caves.
export const NETWORK_ENTRANCE_HALO_STYLE = {
  radius: 9,
  stroke: false,
  fillColor: NETWORK_HIGHLIGHT_ACCENT,
  fillOpacity: 0.25,
  interactive: false
};
export const NETWORK_ENTRANCE_GHOST_STYLE = {
  radius: 5,
  color: MAP_MARKER_OUTLINE_COLOR,
  weight: MAP_MARKER_OUTLINE_WIDTH,
  fillColor: NETWORK_HIGHLIGHT_ACCENT,
  fillOpacity: 1,
  interactive: false
};

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
