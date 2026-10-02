// Interest ("aestheticism") — the backend returns a 0–10 average. The map
// rounds it to half-star steps, matching the comment rating stars.

import { INTEREST_LEVELS, getRatingLevelIds } from './visitRatingLevels';

// Same amber tone as the MUI Rating default fill — used across the map filter
// widget and the popup stars, so the two read as the same rating semantic.
export const INTEREST_STAR_COLOR = '#faaf00';

// Convert the API's 0–10 scale to the half stars used by the map filter.
// Clamp stored filter values too, so a stale or invalid localStorage entry
// cannot show six stars or hide every entrance with an impossible minimum.
export const interestToStars = value =>
  Number.isFinite(value) ? Math.min(5, Math.max(0, Math.round(value) / 2)) : 0;

export const starsToInterest = stars =>
  Math.min(10, Math.max(0, Math.round(stars * 2)));

// A zero or missing average means unrated; the API excludes zero ratings.
export const getInterestLevel = value => {
  if (!Number.isFinite(value) || value <= 0) return null;
  // A strictly-positive average still receives at least half a star.
  return Math.max(0.5, interestToStars(value));
};

export const getInterestLabelKeys = value => {
  const level = getInterestLevel(value);
  return getRatingLevelIds(level == null ? null : value / 2, INTEREST_LEVELS);
};

export const meetsMinimumInterest = (value, minimum) =>
  interestToStars(minimum) === 0 ||
  (getInterestLevel(value) ?? 0) >= interestToStars(minimum);
