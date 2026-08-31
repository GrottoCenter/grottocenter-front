import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import renderWithProviders from '@/test/renderWithProviders';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences, {
  DocumentReferencesSubheader,
  OrganizationDocumentReferences
} from './DocumentReferences';

vi.mock('./DocumentsList', () => ({
  default: ({ documents, emptyMessageComponent, showSort }) =>
    documents.length ? (
      <div data-testid="documents-list" data-show-sort={showSort}>
        {documents.length}
      </div>
    ) : (
      emptyMessageComponent
    )
}));

const organizationMessages = {
  'See all documents': 'See all documents',
  'Showing the latest {visible} of {total} documents':
    'Showing the latest {visible} of {total} documents'
};

const renderOrganizationReferences = props =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={organizationMessages}>
        <OrganizationDocumentReferences {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

describe('OrganizationDocumentReferences', () => {
  it('shows the preview count and links to all matching documents', () => {
    renderOrganizationReferences({
      documents: [{ id: 1 }, { id: 2 }],
      totalCount: 42,
      searchFilter: { 'authors.nickname': 'Alice & Bob' }
    });

    expect(screen.getByTestId('documents-list')).toHaveAttribute(
      'data-show-sort',
      'false'
    );
    expect(
      screen.getByRole('link', { name: 'See all documents' })
    ).toHaveAttribute('href', '/ui/documents?authors.nickname=Alice+%26+Bob');
  });

  it('formats the preview summary for a section subheader', () => {
    render(
      <IntlProvider locale="en" messages={organizationMessages}>
        <DocumentReferencesSubheader visibleCount={10} totalCount={42} />
      </IntlProvider>
    );

    expect(
      screen.getByText('Showing the latest 10 of 42 documents')
    ).toBeInTheDocument();
  });

  it('keeps the link when the whole preview fits on the page', () => {
    renderOrganizationReferences({
      documents: [{ id: 1 }],
      totalCount: 1,
      searchFilter: { 'editor.name': 'Wikicaves' }
    });

    expect(
      screen.getByRole('link', { name: 'See all documents' })
    ).toBeInTheDocument();
  });

  it('hides the preview summary when all documents are displayed', () => {
    const { container } = render(
      <IntlProvider locale="en" messages={organizationMessages}>
        <DocumentReferencesSubheader visibleCount={2} totalCount={2} />
      </IntlProvider>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the empty state without a see-all link', () => {
    renderOrganizationReferences({
      documents: [],
      totalCount: 0,
      searchFilter: { 'authorsOrganization.name': 'Wikicaves' },
      emptyMessageComponent: <div>No documents</div>
    });

    expect(screen.getByText('No documents')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

const bibliographicMessages = {
  'Bibliographic references': 'Bibliographic references',
  'Show more': 'Show more',
  'Show less': 'Show less'
};

const makeDocument = id => ({
  id,
  type: DocumentTypes.TEXT,
  title: `Document ${id}`
});

const renderBibliographicReferences = documents =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentReferences documents={documents} />
    </MemoryRouter>,
    { messages: bibliographicMessages }
  );

describe('DocumentReferences', () => {
  it('renders formatted references as document links', () => {
    renderBibliographicReferences([
      {
        id: 42,
        type: DocumentTypes.ARTICLE,
        title: 'Underground rivers',
        authors: [{ id: 1, nickname: 'DUPONT Jean' }],
        datePublication: '2022',
        parent: { id: 2, title: 'Speleology Review' }
      }
    ]);

    const link = screen.getByRole('link', {
      name: 'DUPONT Jean, 2022. Underground rivers. Speleology Review.'
    });
    expect(link).toHaveAttribute('href', '/ui/documents/42');
    expect(link).not.toHaveAttribute('target');
    expect(screen.getByTestId('ArticleIcon')).toBeInTheDocument();
  });

  it('shows ten references before expanding the complete list', async () => {
    const user = userEvent.setup();
    renderBibliographicReferences(
      Array.from({ length: 12 }, (_, index) => makeDocument(index + 1))
    );

    expect(screen.getAllByRole('link')).toHaveLength(10);
    expect(
      screen.queryByRole('link', { name: 'Document 11' })
    ).not.toBeInTheDocument();

    const showMore = screen.getByRole('button', { name: 'Show more' });
    expect(showMore).toHaveAttribute('aria-expanded', 'false');
    await user.click(showMore);

    expect(screen.getAllByRole('link')).toHaveLength(12);
    expect(screen.getByRole('link', { name: 'Document 11' })).toHaveAttribute(
      'href',
      '/ui/documents/11'
    );
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toHaveAttribute('aria-expanded', 'true');
    await user.click(showLess);

    expect(screen.getAllByRole('link')).toHaveLength(10);
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('uses titles as fallbacks and omits the control for short lists', () => {
    renderBibliographicReferences([makeDocument(1), makeDocument(2)]);

    expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual([
      'Document 1',
      'Document 2'
    ]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
