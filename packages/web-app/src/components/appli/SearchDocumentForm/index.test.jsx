import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import messages from '@/../public/lang/en.json';
import { advancedSearchUrl } from '@/conf/apiRoutes';
import { resetAdvancedSearch } from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import DocumentSearch from '../AdvancedSearch/DocumentSearch';
import SearchResults from '../AdvancedSearch/SearchResults';
import SearchDocumentForm from './index';

vi.mock('@/hooks', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    resetAdvancedSearch: vi.fn(actual.resetAdvancedSearch),
    useOnlineStatus: () => true,
    useDocumentTypes: () => ({ data: [] }),
    useSubjects: () => ({ data: [] })
  };
});

vi.mock('@/components/common/OfflineDisabled', () => ({
  default: ({ children }) => children
}));

vi.mock('@/pages/DocumentDetails', () => ({
  default: ({ id, hideActions }) => (
    <div data-testid="document-preview">
      Document {id}, actions hidden: {String(hideActions)}
    </div>
  )
}));

const theme = createTheme();

const renderSearch = element =>
  renderWithProviders(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{element}</ThemeProvider>
    </MemoryRouter>,
    { messages }
  );

const renderForm = ({ onSubmit = vi.fn(), onSuccess } = {}) =>
  renderSearch(
    <SearchDocumentForm onSubmit={onSubmit} onSuccess={onSuccess} />
  );

const submitSearch = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
};

const selectDocument = async () => {
  submitSearch();
  const row = (await screen.findByText('Document')).closest('tr');
  fireEvent.click(within(row).getByRole('checkbox'));
};

beforeEach(() => {
  localStorage.clear();
  resetAdvancedSearch();
  vi.clearAllMocks();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ id: 1, title: 'Document' }],
          totalResults: 1
        })
      )
    )
  );
});

afterEach(() => {
  cleanup();
  resetAdvancedSearch();
  vi.unstubAllGlobals();
});

describe('SearchDocumentForm submission', () => {
  it('resets and closes only after a successful association', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onSuccess = vi.fn();
    renderForm({ onSubmit, onSuccess });
    await selectDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Associate 1 document' })
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith([{ id: 1, title: 'Document' }]);
    expect(resetAdvancedSearch).toHaveBeenCalledOnce();
  });

  it('keeps the selection open when an association fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('request failed'));
    const onSuccess = vi.fn();
    renderForm({ onSubmit, onSuccess });
    await selectDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Associate 1 document' })
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(resetAdvancedSearch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Associate 1 document' })
    ).toBeEnabled();
  });

  it('previews a document without changing the pending association', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    renderForm({ onSubmit });
    await selectDocument();

    fireEvent.click(screen.getByText('Document'));

    expect(await screen.findByTestId('document-preview')).toHaveTextContent(
      'Document 1, actions hidden: true'
    );
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: messages.close }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: 'Associate 1 document' })
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Associate 1 document' })
    );
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith([{ id: 1, title: 'Document' }])
    );
  });

  it('allows preview before selecting a document', async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    submitSearch();
    fireEvent.click(await screen.findByText('Document'));

    expect(await screen.findByTestId('document-preview')).toHaveTextContent(
      'Document 1, actions hidden: true'
    );
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: messages.close }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: 'Associate 0 documents' })
    ).toBeDisabled();
  });
});

describe('document search validation scope', () => {
  it('posts includePendingDocuments from the association search', async () => {
    renderForm();
    submitSearch();

    await screen.findByText('Document');
    expect(fetch).toHaveBeenCalledWith(
      advancedSearchUrl,
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String)
      })
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      entity: 'documents',
      includePendingDocuments: true
    });
  });

  it('omits includePendingDocuments from an ordinary document search', async () => {
    renderSearch(
      <>
        <DocumentSearch />
        <SearchResults />
      </>
    );
    submitSearch();

    await screen.findByText('Document');
    expect(fetch).toHaveBeenCalledWith(
      advancedSearchUrl,
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty(
      'includePendingDocuments'
    );
  });

  it.each(['table', 'cards'])(
    'labels only pending documents in %s view with inline markup',
    async view => {
      fetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              { id: 1, title: 'Pending document', validationStatus: 'pending' },
              {
                id: 2,
                title: 'Validated document',
                validationStatus: 'validated'
              },
              { id: 3, title: 'Legacy document' }
            ],
            totalResults: 3
          })
        )
      );
      renderForm();
      submitSearch();
      await screen.findByText('Pending document');
      if (view === 'cards') {
        fireEvent.click(screen.getByRole('button', { name: 'Card view' }));
      }

      const labels = screen.getAllByText('Awaiting validation');
      expect(labels).toHaveLength(1);
      const chip = labels[0].parentElement;
      expect(chip.tagName).toBe('SPAN');
      expect(chip.parentElement).toHaveTextContent('Pending document');
      ['Validated document', 'Legacy document'].forEach(title => {
        expect(screen.getByText(title).parentElement).not.toHaveTextContent(
          'Awaiting validation'
        );
      });
    }
  );

  it('preserves the missing-title placeholder beside the pending label', async () => {
    fetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ id: 1, validationStatus: 'pending' }],
          totalResults: 1
        })
      )
    );
    renderForm();
    submitSearch();

    const label = await screen.findByText('Awaiting validation');
    expect(label.parentElement.parentElement).toHaveTextContent(
      '-Awaiting validation'
    );
  });
});
