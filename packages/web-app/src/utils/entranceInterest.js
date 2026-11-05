import {
  durationStringToMinutes,
  formatDurationMinutes
} from './dateTimeDuration';

const durationRange = (comments, field, formatNumberToParts) => {
  const durations = comments
    .map(comment => durationStringToMinutes(comment[field]))
    .filter(minutes => Number.isFinite(minutes) && minutes > 0);
  if (!durations.length) return null;
  const minimum = Math.min(...durations);
  const maximum = Math.max(...durations);
  if (minimum === maximum)
    return formatDurationMinutes(minimum, formatNumberToParts);
  return `${formatDurationMinutes(minimum, formatNumberToParts)}\u00a0– ${formatDurationMinutes(maximum, formatNumberToParts)}`;
};

export const getEntranceInterest = (comments, formatNumberToParts) => {
  const ratings = comments
    .map(comment => comment.aestheticism)
    .filter(value => Number.isFinite(value) && value > 0);
  return {
    average: ratings.length
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length / 2
      : null,
    ratingCount: ratings.length,
    approachTime: durationRange(comments, 'eTTrail', formatNumberToParts),
    undergroundTime: durationRange(
      comments,
      'eTUnderground',
      formatNumberToParts
    )
  };
};
