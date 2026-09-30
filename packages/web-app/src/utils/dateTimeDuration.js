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

// Field adornments have no value, so they use a standalone unit label.
export const formatDurationUnit = (
  unit,
  formatNumberToParts,
  unitDisplay = 'short'
) =>
  formatNumberToParts(0, { style: 'unit', unit, unitDisplay })
    .filter(part => part.type === 'unit' || part.type === 'literal')
    .map(part => part.value)
    .join('')
    .trim();

export const formatDurationMinutes = (minutes, formatNumberToParts) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const formatUnitValue = (value, unit, options = {}) =>
    formatNumberToParts(value, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      ...options
    })
      .map(part => part.value)
      .join('')
      .replace(/\s+/gu, '\u00a0');
  if (hours > 0) {
    const formattedHours = formatUnitValue(hours, 'hour');
    return remainingMinutes > 0
      ? `${formattedHours}\u00a0${formatUnitValue(remainingMinutes, 'minute', {
          minimumIntegerDigits: 2
        })}`
      : formattedHours;
  }
  return remainingMinutes > 0
    ? formatUnitValue(remainingMinutes, 'minute')
    : '';
};
