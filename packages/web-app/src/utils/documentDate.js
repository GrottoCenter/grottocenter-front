import { format, isValid, parseISO } from 'date-fns';

export const getDocumentDate = value => {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value ?? '')) return null;
  const date = parseISO(value);
  return isValid(date) && date.getFullYear() >= 1000 ? date : null;
};

export const toDocumentDate = date => format(date, 'yyyy-MM-dd');

export const normalizeDocumentDateInput = (value, locale) => {
  const input = value.replace(/\p{Cf}/gu, '').trim();
  const match = /^(\d{1,4})([/.-])(\d{1,4})\2(\d{1,4})(.*)$/.exec(input);
  if (!match || getDocumentDate(input)) return input;
  const parts = new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(new Date(2026, 10, 27));
  const [first, , second, third, suffix] = match.slice(1);
  const trailingPart = parts.at(-1);
  if (
    suffix &&
    (trailingPart?.type !== 'literal' ||
      suffix.trim() !== trailingPart.value.trim())
  )
    return input;
  const order = parts.filter(({ type }) =>
    ['year', 'month', 'day'].includes(type)
  );
  const values = [first, second, third];
  const { year, month, day } = Object.fromEntries(
    order.map(({ type }, index) => [type, values[index]])
  );
  if (year?.length !== 4 || month?.length > 2 || day?.length > 2) return input;
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return getDocumentDate(iso) ? iso : input;
};

export const isDocumentDateValid = (
  value,
  allowFuture = false,
  now = new Date()
) => {
  if (!value) return true;
  const date = getDocumentDate(value);
  return !!date && (allowFuture || value <= toDocumentDate(now));
};

export const normalizePublicationDate = value => {
  if (typeof value !== 'string') return null;
  const date = value.trim();
  return date && isDocumentDateValid(date) ? date : null;
};
