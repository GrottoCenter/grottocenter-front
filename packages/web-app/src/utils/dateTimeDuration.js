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
