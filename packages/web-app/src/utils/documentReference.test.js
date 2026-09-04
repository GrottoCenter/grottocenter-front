import {
  formatDocumentReference,
  formatDocumentReferenceParts
} from './documentReference';
import { DocumentTypes } from './documentTypeHelpers';

describe('formatDocumentReference', () => {
  it('formats an article with person and organization authors', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2020-01-01',
      authors: [
        {
          nickname: 'jdupont',
          name: 'Jean',
          surname: 'Dupont'
        }
      ],
      authorsOrganization: [{ name: 'Caving Club' }],
      parent: {
        type: DocumentTypes.ISSUE,
        title: 'Issue 42',
        issue: 'n°42',
        datePublication: '2022-06-15',
        parent: {
          type: DocumentTypes.COLLECTION,
          title: 'Speleology Review'
        }
      },
      pages: '12-18'
    };

    expect(formatDocumentReference(document)).toBe(
      'Jean Dupont; Caving Club, 2022. Underground rivers. Speleology Review. n°42, p. 12-18.'
    );
  });

  it('falls back to the nickname when the real name is incomplete', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [{ nickname: 'caver42', name: 'Alice' }],
      authorsOrganization: []
    };

    expect(formatDocumentReference(document)).toBe(
      'caver42, 1998. Karst atlas.'
    );
  });

  it('formats an article DOI from the current citation payload', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2022',
      authors: [{ nickname: 'DUPONT Jean' }],
      authorsOrganization: [],
      parent: {
        type: DocumentTypes.ISSUE,
        issue: 'no. 42',
        datePublication: '2022',
        parent: {
          type: DocumentTypes.COLLECTION,
          title: 'Speleology Review'
        }
      },
      pages: '12-18',
      identifier: '10.1234/example',
      identifierType: 'doi'
    };

    expect(formatDocumentReference(document)).toBe(
      'DUPONT Jean, 2022. Underground rivers. Speleology Review. no. 42, p. 12-18. DOI 10.1234/example.'
    );
  });

  it('uses legacy BBS publication, issue and page fields as fallbacks', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Legacy article',
      authors: [],
      authorsOrganization: [],
      oldBBS: {
        publicationOther: 'Old Bulletin',
        publicationFascicule: '7',
        pages: '3-5'
      }
    };

    expect(formatDocumentReference(document)).toBe(
      'Legacy article. Old Bulletin. no. 7, p. 3-5.'
    );
  });

  it('formats a book with its publisher and ISBN', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [{ nickname: 'MARTIN Alice' }],
      authorsOrganization: [],
      editor: { name: 'Cave Press' },
      identifier: '978-1-2345-6789-0',
      identifierType: 'isbn'
    };

    expect(formatDocumentReference(document)).toBe(
      'MARTIN Alice, 1998. Karst atlas. Cave Press. ISBN 978-1-2345-6789-0.'
    );
  });

  it('formats a book URL from the current identifier fields', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [{ nickname: 'MARTIN Alice' }],
      authorsOrganization: [],
      editor: { name: 'Cave Press' },
      identifier: 'https://example.org/karst-atlas',
      identifierType: 'url'
    };

    expect(formatDocumentReference(document)).toBe(
      'MARTIN Alice, 1998. Karst atlas [online]. Cave Press. Available at: https://example.org/karst-atlas.'
    );
    expect(
      formatDocumentReferenceParts(document).filter(part => part.isItalic)
    ).toEqual([{ text: 'Karst atlas', isItalic: true }]);
  });

  it('formats a periodical issue as a standalone publication', () => {
    const document = {
      type: DocumentTypes.ISSUE,
      title: "Le P'tit Usnia n° 337",
      datePublication: '2026-09',
      authorsOrganization: [
        {
          id: 21,
          name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
        }
      ],
      authors: [],
      editor: {
        id: 21,
        name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
      },
      identifier: 'https://example.org/le-ptit-usnia-337.pdf',
      identifierType: 'url'
    };

    expect(formatDocumentReference(document)).toBe(
      "Union spéléologique de l’agglomération nancéienne (USAN), 2026. Le P'tit Usnia n° 337 [online]. Available at: https://example.org/le-ptit-usnia-337.pdf."
    );
    expect(
      formatDocumentReferenceParts(document).filter(part => part.isItalic)
    ).toEqual([{ text: "Le P'tit Usnia n° 337", isItalic: true }]);
  });

  it('formats a periodical collection with its publisher and ISSN', () => {
    const document = {
      type: DocumentTypes.COLLECTION,
      title: "Le P'tit Usania",
      authors: [],
      authorsOrganization: [],
      editor: {
        name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
      },
      identifier: '1292-5950',
      identifierType: 'issn'
    };

    expect(formatDocumentReference(document)).toBe(
      "Le P'tit Usania. Union spéléologique de l’agglomération nancéienne (USAN). ISSN 1292-5950."
    );
    expect(
      formatDocumentReferenceParts(document).filter(part => part.isItalic)
    ).toEqual([{ text: "Le P'tit Usania", isItalic: true }]);
  });

  it('keeps a same-named publisher when its organization ID differs', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Karst bulletin',
      datePublication: '2020',
      authorsOrganization: [{ id: 1, name: 'Caving Club' }],
      authors: [],
      editor: { id: 2, name: 'Caving Club' }
    };

    expect(formatDocumentReference(document)).toBe(
      'Caving Club, 2020. Karst bulletin. Caving Club.'
    );
  });

  it('marks the article and host publication titles as italic', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2022',
      authors: [],
      authorsOrganization: [],
      parent: {
        type: DocumentTypes.ISSUE,
        parent: {
          type: DocumentTypes.COLLECTION,
          title: 'Speleology Review'
        }
      }
    };

    expect(
      formatDocumentReferenceParts(document).filter(part => part.isItalic)
    ).toEqual([
      { text: 'Underground rivers', isItalic: true },
      { text: 'Speleology Review', isItalic: true }
    ]);
  });

  it('starts an anonymous reference with its title', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Anonymous karst inventory',
      datePublication: '2001',
      authors: [],
      authorsOrganization: [],
      editor: { name: 'Cave Press' }
    };

    expect(formatDocumentReference(document)).toBe(
      'Anonymous karst inventory. 2001. Cave Press.'
    );
  });

  it('does not build a citation for unsupported types or bare titles', () => {
    expect(
      formatDocumentReference({ type: DocumentTypes.MAP, title: 'Cave map' })
    ).toBeNull();
    expect(
      formatDocumentReference({
        type: DocumentTypes.ARTICLE,
        title: 'Title only',
        authors: [],
        authorsOrganization: []
      })
    ).toBeNull();
    expect(formatDocumentReference(null)).toBeNull();
  });
});
