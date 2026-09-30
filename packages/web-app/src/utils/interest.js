// Interest ("aestheticism") — the backend returns a 0–10 average and the whole
// app displays it as N/5 stars. Helpers here mirror utils/dataQuality.js so the
// two rating families use the same shape (level → label key, single rounding
// rule reused everywhere).

import { INTEREST_LEVELS } from './visitRatingLevels';

// Same amber tone as the MUI Rating default fill — used across the map filter
// widget and the popup stars, so the two read as the same rating semantic.
export const INTEREST_STAR_COLOR = '#faaf00';

// value is on the raw 0–10 scale returned by the API.
// Returns null when the entrance has no rating yet — callers must guard.
export const getInterestLevel = value => {
  if (value == null) return null;
  // Round to nearest star, but a strictly-positive rating never rounds to 0
  // (a comment giving 0.5/10 is still "one star's worth" for display).
  const stars = Math.max(1, Math.round(value / 2));
  return Math.min(5, stars);
};

export const getInterestLabelKey = value => {
  const level = getInterestLevel(value);
  return level == null ? null : INTEREST_LEVELS[level - 1];
};

export const meetsMinimumInterest = (value, minimum) =>
  minimum <= 0 || (getInterestLevel(value) ?? 0) >= minimum / 2;
