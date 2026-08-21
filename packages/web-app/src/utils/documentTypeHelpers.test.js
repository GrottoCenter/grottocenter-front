import {
  filterParentDocumentResults,
  hasSameDocumentId,
  isDocumentSelfParent
} from './documentTypeHelpers';

describe('document parent safeguards', () => {
  it('compares ids independently of their route/API representation', () => {
    expect(hasSameDocumentId(42, '42')).toBe(true);
    expect(hasSameDocumentId(42, 43)).toBe(false);
    expect(hasSameDocumentId(null, null)).toBe(false);
  });

  it('recognizes a document that is its own parent', () => {
    expect(isDocumentSelfParent({ id: 42, parent: { id: '42' } })).toBe(true);
    expect(isDocumentSelfParent({ id: 42, parent: { id: 41 } })).toBe(false);
  });

  it('removes the current document from parent search results', () => {
    const results = [
      { id: 41, title: 'Parent' },
      { id: 42, title: 'Current document' },
      { id: 43, title: 'Other parent' }
    ];

    expect(filterParentDocumentResults(results, '42')).toEqual([
      results[0],
      results[2]
    ]);
  });
});
