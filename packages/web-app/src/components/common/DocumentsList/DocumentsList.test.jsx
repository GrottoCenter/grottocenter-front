import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import renderWithProviders from '@/test/renderWithProviders';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentsList from './DocumentsList';

vi.mock('./Document', () => ({
  default: ({ document }) => <div data-testid={`document-${document.id}`} />
}));
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
  it.each([
    ['GLB', { small: '/model.webp' }, '1 / -1'],
    ['glb', { medium: '/model.webp' }, '1 / -1'],
    ['glb', { large: '/model.webp' }, '1 / -1'],
    ['glb', null, 'auto'],
    ['glb', { small: null, medium: null, large: null }, 'auto'],
    ['gltf', { small: '/model.webp' }, 'auto']
  ])(
    'sizes a card with three images and a %s attachment to match its previews (%j)',
    (extension, thumbnails, gridColumn) => {
      const files = [
        ...[1, 2, 3].map(index => ({
          fileName: `image-${index}.png`,
          completePath: `/image-${index}.png`
        })),
        {
          fileName: `model.${extension}`,
          completePath: `/model.${extension}`,
          thumbnails
        }
      ];
      renderWithProviders(
        <DocumentsList documents={[{ id: 1, title: 'Cave', files }]} />,
        { messages }
      );

      const card = screen.getByTestId('document-1').parentElement.parentElement;
      expect(getComputedStyle(card).gridColumn.replace(/\s/g, '')).toBe(
        gridColumn.replace(/\s/g, '')
      );
    }
  );

  it('renders bibliographic references after the document list', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocumentsList
          showBibliographicReferences
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

  it('omits subsection headings when bibliographic references are disabled', () => {
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

    expect(
      screen.queryByRole('heading', { name: 'Bibliographic references' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Document list' })
    ).not.toBeInTheDocument();
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
