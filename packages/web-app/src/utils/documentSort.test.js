import {
  canSortDocuments,
  DEFAULT_COLLECTION_SORT_ORDER,
  DOCUMENT_SORT_ORDERS,
  sortDocuments
} from './documentSort';

const doc = (title, datePublication = null, dateInscription = null) => ({
  title,
  datePublication,
  dateInscription
});
const titles = documents => documents.map(d => d.title);

describe('canSortDocuments', () => {
  it.each([
    ['no documents', undefined],
    ['an empty list', []],
    ['a single document', [doc('a', '2001')]]
  ])('is false for %s', (_, documents) => {
    expect(canSortDocuments(documents)).toBe(false);
  });

  // Unlike the publication-only sort this replaced, two documents are always
  // enough: dateInscription is always filled and the title order is on the menu.
  it('is true from two documents on, even with identical dates', () => {
    expect(canSortDocuments([doc('a', '2001'), doc('b', '2001')])).toBe(true);
  });
});

describe('sortDocuments', () => {
  it('defaults to publication date, newest first', () => {
    const sorted = sortDocuments([
      doc('b', '2001'),
      doc('c', '2003'),
      doc('a', '2002')
    ]);
    expect(titles(sorted)).toEqual(['c', 'a', 'b']);
  });

  it('exports the same order as the collection default', () => {
    expect(DEFAULT_COLLECTION_SORT_ORDER).toBe(
      DOCUMENT_SORT_ORDERS.PUBLICATION_DESC
    );
  });

  it('sorts by publication date, oldest first on request', () => {
    const sorted = sortDocuments(
      [doc('b', '2001'), doc('c', '2003'), doc('a', '2002')],
      DOCUMENT_SORT_ORDERS.PUBLICATION_ASC
    );
    expect(titles(sorted)).toEqual(['b', 'a', 'c']);
  });

  // The whole point of the second criterion: the publication order and the
  // order things landed in Grottocenter are genuinely different lists.
  it('sorts on the date added, in both directions', () => {
    const documents = [
      doc('b', '2003', '2020-01-01T00:00:00.000Z'),
      doc('a', '2001', '2022-01-01T00:00:00.000Z'),
      doc('c', '2002', '2021-01-01T00:00:00.000Z')
    ];
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.ADDED_DESC))
    ).toEqual(['a', 'c', 'b']);
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.ADDED_ASC))
    ).toEqual(['b', 'c', 'a']);
    // …and neither matches the publication order, which is why both are offered.
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.PUBLICATION_DESC))
    ).toEqual(['b', 'c', 'a']);
  });

  it('compares truncated ISO dates without parsing them', () => {
    const sorted = sortDocuments(
      [doc('c', '2011-06-15'), doc('a', '2011'), doc('b', '2011-06')],
      DOCUMENT_SORT_ORDERS.PUBLICATION_ASC
    );
    expect(titles(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('puts undated documents last, whichever direction is asked for', () => {
    const documents = [doc('undated'), doc('old', '1999'), doc('new', '2020')];
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.PUBLICATION_DESC))
    ).toEqual(['new', 'old', 'undated']);
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.PUBLICATION_ASC))
    ).toEqual(['old', 'new', 'undated']);
  });

  // dateInscription is always filled in practice, but a document list is not
  // the place to find that out the hard way.
  it('puts documents with no date added last too', () => {
    const documents = [
      doc('undated', '2001'),
      doc('added', '2001', '2020-01-01T00:00:00.000Z')
    ];
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.ADDED_DESC))
    ).toEqual(['added', 'undated']);
    expect(
      titles(sortDocuments(documents, DOCUMENT_SORT_ORDERS.ADDED_ASC))
    ).toEqual(['added', 'undated']);
  });

  it('breaks ties on the title, with numeric collation', () => {
    const sorted = sortDocuments(
      [doc('No 10', '2001'), doc('No 2', '2001'), doc('No 1', '2001')],
      DOCUMENT_SORT_ORDERS.PUBLICATION_DESC
    );
    expect(titles(sorted)).toEqual(['No 1', 'No 2', 'No 10']);
  });

  it('sorts by title with numeric collation, not character by character', () => {
    const sorted = sortDocuments(
      [doc('No 10'), doc('No 100'), doc('No 2'), doc('No 1')],
      DOCUMENT_SORT_ORDERS.TITLE
    );
    expect(titles(sorted)).toEqual(['No 1', 'No 2', 'No 10', 'No 100']);
  });

  it('ignores case and accents when comparing titles', () => {
    const sorted = sortDocuments(
      [doc('éboulis'), doc('Aven'), doc('Eboulis')],
      DOCUMENT_SORT_ORDERS.TITLE
    );
    expect(titles(sorted)[0]).toBe('Aven');
  });

  // A null title used to throw inside the comparator; the exception was caught
  // by the fetch chain and the whole children list disappeared behind a generic
  // error. One bad row must not take the page down.
  it('survives a null or missing title', () => {
    const documents = [
      doc(null, '2001'),
      { datePublication: '2002' },
      doc('real', '2003')
    ];
    expect(() => sortDocuments(documents)).not.toThrow();
    expect(sortDocuments(documents)).toHaveLength(3);
    expect(() =>
      sortDocuments(documents, DOCUMENT_SORT_ORDERS.TITLE)
    ).not.toThrow();
    expect(() =>
      sortDocuments(documents, DOCUMENT_SORT_ORDERS.ADDED_DESC)
    ).not.toThrow();
  });

  it('does not mutate the array it is given', () => {
    const documents = [doc('b', '2001'), doc('a', '2003')];
    const snapshot = titles(documents);
    sortDocuments(documents);
    expect(titles(documents)).toEqual(snapshot);
  });

  it.each([undefined, null, []])('returns an empty array for %s', input => {
    expect(sortDocuments(input)).toEqual([]);
  });

  it('falls back to the default order for an unknown order', () => {
    const documents = [doc('b', '2001'), doc('a', '2003')];
    expect(titles(sortDocuments(documents, 'nonsense'))).toEqual(['a', 'b']);
  });

  // The locale reaches the collator from Redux state; a malformed tag must not
  // take the whole sort down with it.
  it('falls back to the default collator for an invalid locale', () => {
    const documents = [doc('b'), doc('a')];
    expect(() =>
      sortDocuments(documents, DOCUMENT_SORT_ORDERS.TITLE, 'not a locale')
    ).not.toThrow();
    expect(
      titles(
        sortDocuments(documents, DOCUMENT_SORT_ORDERS.TITLE, 'not a locale')
      )
    ).toEqual(['a', 'b']);
  });
});
