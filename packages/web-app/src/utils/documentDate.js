import { format, isMatch } from 'date-fns';

const DATE_FORMATS = { 4: 'yyyy', 7: 'yyyy-MM', 10: 'yyyy-MM-dd' };

export const normalizePublicationDate = value => {
  if (typeof value !== 'string') return null;
  const date = value.trim();
  const pattern = DATE_FORMATS[date.length];
  if (
    !pattern ||
    !/^\d{4}(-\d{2}){0,2}$/.test(date) ||
    !isMatch(date, pattern) ||
    date < '1000' ||
    date > format(new Date(), 'yyyy-MM-dd')
  ) {
    return null;
  }
  return date;
};
