import {
  DATA_QUALITY_LEVELS,
  getDataQualityLevel,
  getDataQualityValue
} from './dataQuality';
import { meetsMinimumInterest } from './interest';

export const CAVE_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
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

export const CAVE_QUALITY = DATA_QUALITY_LEVELS;

export const getCaveQuality = entrance => {
  const value = getDataQualityValue(entrance.dataQuality);
  return value == null ? null : getDataQualityLevel(value);
};

const allOn = keys => Object.fromEntries(keys.map(key => [key, true]));
export const DEFAULT_ENTRANCE_FILTERS = allOn(Object.values(CAVE_SIZE));
export const DEFAULT_QUALITY_FILTERS = allOn(Object.values(CAVE_QUALITY));
export const DEFAULT_MIN_INTEREST = 0;

// Backend size codes deliberately follow these thresholds, not size_coef.
const SIZE_BY_CODE = {
  1: CAVE_SIZE.SMALL,
  2: CAVE_SIZE.MEDIUM,
  3: CAVE_SIZE.LARGE
};

// Legacy cache compatibility: old offline responses contain only [lng, lat].
// Format detection is independent of individual missing or malformed criteria.
export const hasEntranceCoordinateCriteria = tuple =>
  Array.isArray(tuple) && tuple.length === 5;

const matchesCriteria = (size, dataQuality, interest, filters) => {
  if (!filters.sizes[size]) return false;
  const value = getDataQualityValue(dataQuality);
  // Missing quality remains visible; zero belongs to "insufficient".
  if (value != null && !filters.qualities[getDataQualityLevel(value)])
    return false;
  return meetsMinimumInterest(interest, filters.minInterest);
};

export const matchesEntranceMarker = (entrance, filters) =>
  matchesCriteria(
    getCaveSize(entrance),
    entrance.dataQuality,
    entrance.aestheticism,
    filters
  );

export const matchesEntranceCoordinate = (tuple, filters) => {
  // Legacy cache compatibility: an individual pair stays visible even when
  // other tuples in the dataset have filtering criteria.
  if (!hasEntranceCoordinateCriteria(tuple)) return true;
  // A malformed entrance must not disable filtering for the whole dataset.
  // Keep it visible; missing quality is supported just like detailed markers.
  if (
    SIZE_BY_CODE[tuple[2]] === undefined ||
    (tuple[3] !== null && !Number.isFinite(tuple[3])) ||
    (tuple[4] !== null && !Number.isFinite(tuple[4]))
  )
    return true;
  return matchesCriteria(SIZE_BY_CODE[tuple[2]], tuple[3], tuple[4], filters);
};
