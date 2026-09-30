export const INTEREST_LEVELS = [
  'No interest',
  'Limited interest',
  'Interesting',
  'Remarkable',
  'Exceptional'
];

export const EASE_LEVELS = [
  'Very difficult',
  'Difficult',
  'Intermediate',
  'Easy',
  'Very easy'
];

export const getRatingLevelIds = (rating, levels) => {
  if (rating == null || rating <= 0 || levels.length === 0) return [];

  const lowerIndex = Math.min(
    levels.length - 1,
    Math.max(0, Math.floor(rating) - 1)
  );
  const upperIndex = Math.min(levels.length - 1, Math.ceil(rating) - 1);

  return upperIndex === lowerIndex
    ? [levels[lowerIndex]]
    : [levels[lowerIndex], levels[upperIndex]];
};
