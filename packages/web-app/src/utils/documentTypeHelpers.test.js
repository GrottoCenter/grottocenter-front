import {
  DocumentTypes,
  filterDocumentPayload,
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

  describe('document payload metadata', () => {
    it('retains collection publication rights but never attachments', () => {
      const rights = {
        license: { id: 2, name: 'CC-BY' },
        authorizationDocument: { id: 99 },
        selectOptionAuthorizationDocument:
          'Authorization present in Grottocenter'
      };
      expect(
        filterDocumentPayload({
          type: DocumentTypes.COLLECTION,
          ...rights,
          files: [{ id: 10 }],
          parent: { id: 11 }
        })
      ).toEqual({ type: DocumentTypes.COLLECTION, ...rights });
    });

    it.each([DocumentTypes.IMAGE, DocumentTypes.BOOK])(
      'omits issue and pages for %s when their inputs are not displayed',
      type => {
        expect(
          filterDocumentPayload({
            type,
            title: 'A title',
            pages: 'a'.repeat(101),
            issue: 'b'.repeat(101)
          })
        ).toEqual({ type, title: 'A title' });
      }
    );

    it('retains pages for articles and issue numbers for periodical issues', () => {
      expect(
        filterDocumentPayload({
          type: DocumentTypes.ARTICLE,
          pages: '10-12',
          issue: 'Volume 2'
        })
      ).toEqual({ type: DocumentTypes.ARTICLE, pages: '10-12' });
      expect(
        filterDocumentPayload({
          type: DocumentTypes.ISSUE,
          pages: '10-12',
          issue: 'Volume 2'
        })
      ).toEqual({ type: DocumentTypes.ISSUE, issue: 'Volume 2' });
    });
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
