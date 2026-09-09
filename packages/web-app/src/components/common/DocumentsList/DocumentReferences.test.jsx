import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import DocumentReferences, {
  DocumentReferencesSubheader
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

const messages = {
  'See all documents': 'See all documents',
  'Showing the latest {visible} of {total} documents':
    'Showing the latest {visible} of {total} documents'
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

    expect(screen.getByTestId('documents-list')).toHaveAttribute(
      'data-show-sort',
      'false'
    );
    expect(
      screen.getByRole('link', { name: 'See all documents' })
    ).toHaveAttribute('href', '/ui/documents?authors.nickname=Alice+%26+Bob');
    expect(screen.getByRole('link', { name: 'See all documents' })).toHaveClass(
      'MuiButton-outlined'
    );
  });

  it('formats the preview summary for a section subheader', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <DocumentReferencesSubheader visibleCount={10} totalCount={42} />
      </IntlProvider>
    );

    expect(
      screen.getByText('Showing the latest 10 of 42 documents')
    ).toBeInTheDocument();
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
