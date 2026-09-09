import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import renderWithProviders from '@/test/renderWithProviders';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentsList from './DocumentsList';

vi.mock('./Document', () => ({ default: () => null }));
vi.mock('./ImageLightbox', () => ({ default: () => null }));
vi.mock('./ImageThumbnail', () => ({ GALLERY_MIN_IMAGES: 4 }));

const messages = {
  Added: 'Added',
  'Available at:': 'Available at:',
  'Bibliographic references': 'Bibliographic references',
  'Copy reference': 'Copy reference',
  'Document list': 'Document list',
  'Document type': 'Document type',
  'documentsSort.optionLabel': '{criterion} - {direction}',
  'Newest first': 'Newest first',
  online: 'online',
  'Oldest first': 'Oldest first',
  Publication: 'Publication',
  'Reference copied': 'Reference copied',
  'Sort by': 'Sort by',
  Title: 'Title',
  'Unable to copy reference': 'Unable to copy reference'
};

describe('DocumentsList', () => {
  it('renders bibliographic references after the document list', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocumentsList
          documents={[
            {
              id: 1,
              type: DocumentTypes.BOOK,
              title: 'Karst atlas',
              datePublication: '2024',
              authors: [],
              authorsOrganization: []
            }
          ]}
        />
      </MemoryRouter>,
      { messages }
    );

    const documentListHeading = screen.getByRole('heading', {
      name: 'Document list'
    });
    const referencesHeading = screen.getByRole('heading', {
      name: 'Bibliographic references'
    });

    expect(documentListHeading.compareDocumentPosition(referencesHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('accepts document type as its initial sort order', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocumentsList
          defaultSortOrder={DOCUMENT_SORT_ORDERS.TYPE}
          documents={[
            {
              id: 1,
              type: DocumentTypes.BOOK,
              title: 'Book',
              authors: [],
              authorsOrganization: []
            },
            {
              id: 2,
              type: DocumentTypes.IMAGE,
              title: 'Image',
              authors: [],
              authorsOrganization: []
            }
          ]}
        />
      </MemoryRouter>,
      { messages }
    );

    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveTextContent(
      'Document type'
    );
  });
});
