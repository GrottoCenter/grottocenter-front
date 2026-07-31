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
// A null title would throw on the comparison and reject the whole fetch, so it
// falls back to an empty string.
const compareTitles = (a, b, compare) => compare(a.title ?? '', b.title ?? '');

// datePublication is a truncated ISO string ("2011", "2011-06", "2011-06-15"),
// so plain string comparison already orders it chronologically — no parsing,
// and no risk of reading a year-only value as a timestamp.
const compareDates = (a, b, compare, direction) => {
  const dateA = a.datePublication || '';
  const dateB = b.datePublication || '';
  if (dateA === dateB) return compareTitles(a, b, compare);
  // Undated documents always close the list, whichever direction is asked for.
  if (!dateA) return 1;
  if (!dateB) return -1;
  // `direction` is the sign given to "a is after b": 1 puts the later date last
  // (ascending), -1 puts it first (descending).
  return dateA < dateB ? -direction : direction;
};

/**
 * Whether offering a sort order can change anything at all.
 *
 * compareDates falls back to the title as soon as two dates are equal, so when
 * every document shares the same datePublication all three orders collapse onto
 * the very same list. Lives next to the comparators on purpose: the answer is
 * only true for as long as they behave that way.
 */
export const canReorderDocumentChildren = documents => {
  if ((documents?.length ?? 0) < 2) return false;
  const dates = new Set(documents.map(doc => doc.datePublication || ''));
  return dates.size > 1;
};

export const sortDocumentChildren = (
  documents,
  order = DEFAULT_CHILDREN_SORT_ORDER,
  locale = 'en'
) => {
  const sorted = [...(documents ?? [])];
  // One collator for the whole sort. Handing a locale and options to
  // localeCompare bypasses the engine's cached default collator, so it builds a
  // fresh one on every single comparison — n log n of them on a collection that
  // can hold thousands of issues.
  const { compare } = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: 'base'
  });
  switch (order) {
    case CHILDREN_SORT_ORDERS.DATE_ASC:
      return sorted.sort((a, b) => compareDates(a, b, compare, 1));
    case CHILDREN_SORT_ORDERS.TITLE:
      return sorted.sort((a, b) => compareTitles(a, b, compare));
    case CHILDREN_SORT_ORDERS.DATE_DESC:
    default:
      return sorted.sort((a, b) => compareDates(a, b, compare, -1));
  }
};
