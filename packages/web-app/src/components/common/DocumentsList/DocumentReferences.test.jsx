import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import DocumentReferences from './DocumentReferences';

vi.mock('./DocumentsList', () => ({
  default: ({ documents, emptyMessageComponent }) =>
    documents.length ? (
      <div data-testid="documents-list">{documents.length}</div>
    ) : (
      emptyMessageComponent
    )
}));

const messages = {
  'See all documents': 'See all documents',
  'Showing {visible} of {total} documents':
    'Showing {visible} of {total} documents'
};

const renderReferences = props =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <DocumentReferences {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

describe('DocumentReferences', () => {
  it('shows the preview count and links to all matching documents', () => {
    renderReferences({
      documents: [{ id: 1 }, { id: 2 }],
      totalCount: 42,
      searchFilter: { 'authors.nickname': 'Alice & Bob' }
    });

    expect(screen.getByText('Showing 2 of 42 documents')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'See all documents' })
    ).toHaveAttribute('href', '/ui/documents?authors.nickname=Alice+%26+Bob');
  });

  it('keeps the link when the whole preview fits on the page', () => {
    renderReferences({
      documents: [{ id: 1 }],
      totalCount: 1,
      searchFilter: { 'editor.name': 'Wikicaves' }
    });

    expect(
      screen.getByRole('link', { name: 'See all documents' })
    ).toBeInTheDocument();
  });

  it('renders the empty state without a see-all link', () => {
    renderReferences({
      documents: [],
      totalCount: 0,
      searchFilter: { 'authorsOrganization.name': 'Wikicaves' },
      emptyMessageComponent: <div>No documents</div>
    });

    expect(screen.getByText('No documents')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
