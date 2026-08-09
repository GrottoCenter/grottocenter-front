// The single sort vocabulary for every list of documents: the ones attached to
// an entity (entrance, massif, organization, person) and the children of a
// collection. Both come from the API in the very same shape, so offering two
// different sets of orders would have been a distinction with no cause.
export const DOCUMENT_SORT_ORDERS = {
  PUBLICATION_DESC: 'publicationDesc',
  PUBLICATION_ASC: 'publicationAsc',
  ADDED_DESC: 'addedDesc',
  ADDED_ASC: 'addedAsc',
  TITLE: 'title'
};

export const DEFAULT_DOCUMENT_SORT_ORDER =
  DOCUMENT_SORT_ORDERS.PUBLICATION_DESC;

const DATE_FIELDS = {
  [DOCUMENT_SORT_ORDERS.PUBLICATION_DESC]: 'datePublication',
  [DOCUMENT_SORT_ORDERS.PUBLICATION_ASC]: 'datePublication',
  [DOCUMENT_SORT_ORDERS.ADDED_DESC]: 'dateInscription',
  [DOCUMENT_SORT_ORDERS.ADDED_ASC]: 'dateInscription'
};

// `direction` is the sign given to "a is after b": 1 puts the later date last
// (ascending), -1 puts it first (descending).
const DIRECTIONS = {
  [DOCUMENT_SORT_ORDERS.PUBLICATION_DESC]: -1,
  [DOCUMENT_SORT_ORDERS.PUBLICATION_ASC]: 1,
  [DOCUMENT_SORT_ORDERS.ADDED_DESC]: -1,
  [DOCUMENT_SORT_ORDERS.ADDED_ASC]: 1
};

// Numeric collation keeps "No 2" before "No 10" instead of comparing '2' and
// '1' as plain characters. It is only ever used as a tie-breaker: a title is
// free text, it does not always hold an issue number, and a title that departs
// from the collection's usual pattern ("Hors-série Vercors") lands wherever the
// alphabet puts it. The chronology comes from the date, not from here.
// A null title would throw on the comparison and reject the whole fetch, so it
// falls back to an empty string.
const compareTitles = (a, b, compare) => compare(a.title ?? '', b.title ?? '');

// Both date fields are truncated ISO strings — "2011", "2011-06", "2011-06-15"
// for datePublication, a full timestamp for dateInscription — so plain string
// comparison already orders them chronologically: no parsing, and no risk of
// reading a year-only value as a timestamp.
const compareByDate = (a, b, { field, compare, direction }) => {
  const dateA = a[field] || '';
  const dateB = b[field] || '';
  if (dateA === dateB) return compareTitles(a, b, compare);
  // Undated documents always close the list, whichever direction is asked for.
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateA < dateB ? -direction : direction;
};

/**
 * Whether offering a sort order can change anything at all.
 *
 * Two documents are enough: dateInscription is always filled and an
 * alphabetical order is on the menu, so unlike the publication-only sort this
 * replaced, the orders can no longer all collapse onto the same list. The one
 * degenerate case left — two documents sharing both dates — is not worth
 * scanning three fields per document on a collection that can hold thousands of
 * issues.
 */
export const canSortDocuments = documents => (documents?.length ?? 0) >= 2;

export const sortDocuments = (
  documents,
  order = DEFAULT_DOCUMENT_SORT_ORDER,
  locale = 'en'
) => {
  const sorted = [...(documents ?? [])];
  // One collator for the whole sort. Handing a locale and options to
  // localeCompare bypasses the engine's cached default collator, so it builds a
  // fresh one on every single comparison — n log n of them on a collection that
  // can hold thousands of issues.
  // The locale comes from Redux state and could in principle hold a value the
  // runtime rejects; fall back to 'en' rather than let a malformed tag throw and
  // silently degrade every sort into the browser default.
  const collatorOptions = { numeric: true, sensitivity: 'base' };
  let compare;
  // .compare is a bound getter per ECMA-402, safe to destructure.
  try {
    ({ compare } = new Intl.Collator(locale, collatorOptions));
  } catch {
    ({ compare } = new Intl.Collator('en', collatorOptions));
  }
  if (order === DOCUMENT_SORT_ORDERS.TITLE) {
    return sorted.sort((a, b) => compareTitles(a, b, compare));
  }
  // An unknown order lands on the default rather than leaving the list in the
  // raw API order, which is what the sort exists to replace.
  const field = DATE_FIELDS[order] ?? DATE_FIELDS[DEFAULT_DOCUMENT_SORT_ORDER];
  const direction =
    DIRECTIONS[order] ?? DIRECTIONS[DEFAULT_DOCUMENT_SORT_ORDER];
  return sorted.sort((a, b) =>
    compareByDate(a, b, { field, compare, direction })
  );
};
