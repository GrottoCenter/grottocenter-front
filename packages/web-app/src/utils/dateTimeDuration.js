/**
 *
 * @param minutes Integer Duration in number of minutes
 * @returns string formatted as hh:mm:ss
 */
import { isEmpty, isNil } from 'ramda';

export const minutesToDurationString = minutes => {
  if (isNil(minutes) || +minutes === 0) return null;
  return `${Math.floor(Math.abs(+minutes) / 60)}:${(Math.abs(+minutes) % 60)
    .toString(10)
    .padStart(2, '0')}:00`;
};

/**
 *
 * @param durationStr string formatted as hh:mm:ss
 * @returns minutes Integer Duration in number of minutes
 */
export const durationStringToMinutes = durationStr => {
  if (isEmpty(durationStr) || isNil(durationStr)) return null;
  const splitDuration = durationStr.split(':');
  return +splitDuration[0] * 60 + +splitDuration[1];
};

export const formatDurationUnit = (
  unit,
  formatNumberToParts,
  unitDisplay = 'narrow'
) =>
  formatNumberToParts(0, { style: 'unit', unit, unitDisplay })
    .filter(part => part.type === 'unit' || part.type === 'literal')
    .map(part => part.value)
    .join('')
    .trim();

export const formatDurationMinutes = (minutes, formatNumberToParts) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const formatNumber = value =>
    formatNumberToParts(value)
      .map(part => part.value)
      .join('');
  if (hours > 0) {
    const formattedHours = `${formatNumber(hours)}\u00a0${formatDurationUnit('hour', formatNumberToParts)}`;
    return remainingMinutes > 0
      ? `${formattedHours}\u00a0${formatNumber(remainingMinutes)}`
      : formattedHours;
  }
  return remainingMinutes > 0
    ? `${formatNumber(remainingMinutes)}\u00a0${formatDurationUnit('minute', formatNumberToParts, 'short')}`
    : '';
};
