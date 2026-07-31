export const CHILDREN_SORT_ORDERS = {
  DATE_DESC: 'dateDesc',
  DATE_ASC: 'dateAsc',
  TITLE: 'title'
};

export const DEFAULT_CHILDREN_SORT_ORDER = CHILDREN_SORT_ORDERS.DATE_DESC;

// Numeric collation keeps "No 2" before "No 10" instead of comparing '2' and
// '1' as plain characters. It is only ever used as a tie-breaker: a title is
// free text, it does not always hold an issue number, and a title that departs
// from the collection's usual pattern ("Hors-série Vercors") lands wherever the
// alphabet puts it. The chronology comes from datePublication, not from here.
// A null title would throw on localeCompare and reject the whole fetch, so it
// falls back to an empty string.
const compareTitles = (a, b, locale) =>
  (a.title ?? '').localeCompare(b.title ?? '', locale, {
    numeric: true,
    sensitivity: 'base'
  });

// datePublication is a truncated ISO string ("2011", "2011-06", "2011-06-15"),
// so plain string comparison already orders it chronologically — no parsing,
// and no risk of reading a year-only value as a timestamp.
const compareDates = (a, b, locale, direction) => {
  const dateA = a.datePublication || '';
  const dateB = b.datePublication || '';
  if (dateA === dateB) return compareTitles(a, b, locale);
  // Undated documents always close the list, whichever direction is asked for.
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA < dateB ? -direction : direction;
};

export const sortDocumentChildren = (
  documents,
  order = DEFAULT_CHILDREN_SORT_ORDER,
  locale = 'en'
) => {
  const sorted = [...(documents ?? [])];
  switch (order) {
    case CHILDREN_SORT_ORDERS.DATE_ASC:
      return sorted.sort((a, b) => compareDates(a, b, locale, 1));
    case CHILDREN_SORT_ORDERS.TITLE:
      return sorted.sort((a, b) => compareTitles(a, b, locale));
    case CHILDREN_SORT_ORDERS.DATE_DESC:
    default:
      return sorted.sort((a, b) => compareDates(a, b, locale, -1));
  }
};
