import {
  canReorderDocumentChildren,
  CHILDREN_SORT_ORDERS,
  DEFAULT_CHILDREN_SORT_ORDER,
  sortDocumentChildren
} from './documentChildrenSort';

const doc = (title, datePublication = null) => ({ title, datePublication });
const titles = documents => documents.map(d => d.title);

describe('canReorderDocumentChildren', () => {
  it.each([
    ['no documents', undefined],
    ['an empty list', []],
    ['a single document', [doc('a', '2001')]]
  ])('is false for %s', (_, documents) => {
    expect(canReorderDocumentChildren(documents)).toBe(false);
  });

  it('is false when every document shares the same date', () => {
    expect(
      canReorderDocumentChildren([
        doc('c', '2001'),
        doc('a', '2001'),
        doc('b', '2001')
      ])
    ).toBe(false);
  });

  it('is false when no document has a date at all', () => {
    expect(canReorderDocumentChildren([doc('a'), doc('b')])).toBe(false);
  });

  it('is true as soon as two dates differ', () => {
    expect(
      canReorderDocumentChildren([doc('a', '2001'), doc('b', '2002')])
    ).toBe(true);
  });

  it('is true when some documents are undated and others are not', () => {
    expect(canReorderDocumentChildren([doc('a', '2001'), doc('b')])).toBe(true);
  });

  it('treats an empty-string date as undated', () => {
    expect(canReorderDocumentChildren([doc('a', ''), doc('b', null)])).toBe(
      false
    );
  });
});

describe('sortDocumentChildren', () => {
  it('defaults to newest first', () => {
    expect(DEFAULT_CHILDREN_SORT_ORDER).toBe(CHILDREN_SORT_ORDERS.DATE_DESC);
    const sorted = sortDocumentChildren([
      doc('b', '2001'),
      doc('c', '2003'),
      doc('a', '2002')
    ]);
    expect(titles(sorted)).toEqual(['c', 'a', 'b']);
  });

  it('sorts oldest first on request', () => {
    const sorted = sortDocumentChildren(
      [doc('b', '2001'), doc('c', '2003'), doc('a', '2002')],
      CHILDREN_SORT_ORDERS.DATE_ASC
    );
    expect(titles(sorted)).toEqual(['b', 'a', 'c']);
  });

  it('compares truncated ISO dates without parsing them', () => {
    const sorted = sortDocumentChildren(
      [doc('c', '2011-06-15'), doc('a', '2011'), doc('b', '2011-06')],
      CHILDREN_SORT_ORDERS.DATE_ASC
    );
    expect(titles(sorted)).toEqual(['a', 'b', 'c']);
  });

  it('puts undated documents last, whichever direction is asked for', () => {
    const documents = [doc('undated'), doc('old', '1999'), doc('new', '2020')];
    expect(
      titles(sortDocumentChildren(documents, CHILDREN_SORT_ORDERS.DATE_DESC))
    ).toEqual(['new', 'old', 'undated']);
    expect(
      titles(sortDocumentChildren(documents, CHILDREN_SORT_ORDERS.DATE_ASC))
    ).toEqual(['old', 'new', 'undated']);
  });

  it('breaks ties on the title, with numeric collation', () => {
    const sorted = sortDocumentChildren(
      [doc('No 10', '2001'), doc('No 2', '2001'), doc('No 1', '2001')],
      CHILDREN_SORT_ORDERS.DATE_DESC
    );
    expect(titles(sorted)).toEqual(['No 1', 'No 2', 'No 10']);
  });

  it('sorts by title with numeric collation, not character by character', () => {
    const sorted = sortDocumentChildren(
      [doc('No 10'), doc('No 100'), doc('No 2'), doc('No 1')],
      CHILDREN_SORT_ORDERS.TITLE
    );
    expect(titles(sorted)).toEqual(['No 1', 'No 2', 'No 10', 'No 100']);
  });

  it('ignores case and accents when comparing titles', () => {
    const sorted = sortDocumentChildren(
      [doc('éboulis'), doc('Aven'), doc('Eboulis')],
      CHILDREN_SORT_ORDERS.TITLE
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
    expect(() => sortDocumentChildren(documents)).not.toThrow();
    expect(sortDocumentChildren(documents)).toHaveLength(3);
    expect(() =>
      sortDocumentChildren(documents, CHILDREN_SORT_ORDERS.TITLE)
    ).not.toThrow();
  });

  it('does not mutate the array it is given', () => {
    const documents = [doc('b', '2001'), doc('a', '2003')];
    const snapshot = titles(documents);
    sortDocumentChildren(documents);
    expect(titles(documents)).toEqual(snapshot);
  });

  it.each([undefined, null, []])('returns an empty array for %s', input => {
    expect(sortDocumentChildren(input)).toEqual([]);
  });

  it('falls back to the default order for an unknown order', () => {
    const documents = [doc('b', '2001'), doc('a', '2003')];
    expect(titles(sortDocumentChildren(documents, 'nonsense'))).toEqual([
      'a',
      'b'
    ]);
  });

  it('produces the same list in every order once dates are equal', () => {
    const documents = [doc('b', '2001'), doc('a', '2001'), doc('c', '2001')];
    const results = Object.values(CHILDREN_SORT_ORDERS).map(order =>
      titles(sortDocumentChildren(documents, order))
    );
    expect(new Set(results.map(r => r.join('|'))).size).toBe(1);
    // …which is exactly why canReorderDocumentChildren hides the control.
    expect(canReorderDocumentChildren(documents)).toBe(false);
  });
});
