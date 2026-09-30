const RATING_FILTER_KEYS = new Set([
  'commentsRating.aestheticism',
  'commentsRating.approach',
  'commentsRating.caving'
]);

export const isRatingFilter = key => RATING_FILTER_KEYS.has(key);

export const normalizeRatingRange = range =>
  range.map(rating => Math.max(0, Math.min(10, Math.round(rating / 2) * 2)));

export const formatRatingRange = ([minimum, maximum], formatNumber) => {
  const [normalizedMinimum, normalizedMaximum] = normalizeRatingRange([
    minimum,
    maximum
  ]);
  const low = formatNumber(normalizedMinimum / 2);
  const high = formatNumber(normalizedMaximum / 2);

  if (normalizedMinimum === 0 && normalizedMaximum === 10)
    return `${low}–${high}★`;
  if (normalizedMinimum === 0) return `≤ ${high}★`;
  if (normalizedMaximum === 10) return `≥ ${low}★`;
  return `${low}–${high}★`;
};
