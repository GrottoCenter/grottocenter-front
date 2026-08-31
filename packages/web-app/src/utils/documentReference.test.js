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
      authors: [{ nickname: 'DUPONT, Jean' }],
      authorsOrganization: [{ name: 'Caving Club' }],
      parent: { title: 'Speleology Review' },
      issue: '42',
      pages: '12-18'
    };

    expect(formatDocumentReference(document)).toBe(
      'DUPONT, Jean; Caving Club, 2022. Underground rivers. Speleology Review. 42, 12-18.'
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
      'Legacy article. Old Bulletin. 7, 3-5.'
    );
  });

  it('formats a book with its publisher, collection and ISBN', () => {
    const document = {
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [{ nickname: 'MARTIN, Alice' }],
      editor: { name: 'Cave Press' },
      parent: { title: 'Regional atlases' },
      identifier: '978-1-2345-6789-0',
      identifierType: { id: 'isbn' }
    };

    expect(formatDocumentReference(document)).toBe(
      'MARTIN, Alice, 1998. Karst atlas. Cave Press. Regional atlases. 978-1-2345-6789-0.'
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
