import { format, isValid, parseISO } from 'date-fns';

export const getDocumentDate = value => {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value ?? '')) return null;
  const date = parseISO(value);
  return isValid(date) && date.getFullYear() >= 1000 ? date : null;
};

export const toDocumentDate = date => format(date, 'yyyy-MM-dd');

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
