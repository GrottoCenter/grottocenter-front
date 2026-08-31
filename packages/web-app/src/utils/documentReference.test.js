import {
  formatDocumentReference,
  getDocumentReferenceLabel
} from './documentReference';
import { DocumentTypes } from './documentTypeHelpers';

describe('formatDocumentReference', () => {
  it('formats an article with person and organization authors', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2022-06-15',
      authors: [{ nickname: 'DUPONT Jean' }],
      authorsOrganization: [{ name: 'Caving Club' }],
      parent: { title: 'Speleology Review, no. 42' },
      pages: '12-18'
    };

    expect(formatDocumentReference(document)).toBe(
      'DUPONT Jean; Caving Club, 2022. Underground rivers. Speleology Review, no. 42. 2022-06-15. p. 12-18.'
    );
  });

  it('formats an article DOI from the current citation payload', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2022',
      authors: [{ nickname: 'DUPONT Jean' }],
      parent: { title: 'Speleology Review, no. 42' },
      pages: '12-18',
      identifier: '10.1234/example',
      identifierType: 'doi'
    };

    expect(formatDocumentReference(document)).toBe(
      'DUPONT Jean, 2022. Underground rivers. Speleology Review, no. 42. p. 12-18. DOI 10.1234/example.'
    );
  });

  it('uses legacy BBS publication, issue and page fields as fallbacks', () => {
    const document = {
      type: DocumentTypes.ARTICLE,
      title: 'Legacy article',
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
      editor: { name: 'Cave Press' },
      identifier: '978-1-2345-6789-0',
      identifierType: { id: 'isbn' }
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
      editor: { name: 'Cave Press' },
      identifier: 'https://example.org/karst-atlas',
      identifierType: 'url'
    };

    expect(formatDocumentReference(document)).toBe(
      'MARTIN Alice, 1998. Karst atlas [online]. Cave Press. Available at: https://example.org/karst-atlas.'
    );
  });

  it('starts an anonymous reference with its title', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Anonymous karst inventory',
      datePublication: '2001',
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
        title: 'Title only'
      })
    ).toBeNull();
    expect(formatDocumentReference(null)).toBeNull();
  });

  it('falls back to the title for reference-list labels', () => {
    expect(
      getDocumentReferenceLabel({
        type: DocumentTypes.IMAGE,
        title: 'Entrance photograph'
      })
    ).toBe('Entrance photograph');
    expect(getDocumentReferenceLabel({ type: DocumentTypes.IMAGE })).toBeNull();
  });
});
