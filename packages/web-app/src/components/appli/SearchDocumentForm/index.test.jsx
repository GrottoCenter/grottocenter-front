import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { resetAdvancedSearch } from '@/hooks';
import SearchDocumentForm from './index';

vi.mock('@/hooks', () => ({
  resetAdvancedSearch: vi.fn(),
  useOnlineStatus: () => true
}));

vi.mock('@/components/common/OfflineDisabled', () => ({
  default: ({ children }) => children
}));

vi.mock('../AdvancedSearch/DocumentSearch', () => ({
  default: () => null
}));

vi.mock('../AdvancedSearch/SearchResults', () => ({
  default: ({ onSelected, onRowClick }) => (
    <>
      <button
        type="button"
        onClick={() => onSelected([1], [{ id: 1, title: 'Document' }])}>
        Select result
      </button>
      <button type="button" onClick={() => onRowClick({ id: 1 })}>
        Preview result
      </button>
    </>
  )
}));

vi.mock('@/pages/DocumentDetails', () => ({
  default: ({ id, hideActions }) => (
    <div data-testid="document-preview">
      Document {id}, actions hidden: {String(hideActions)}
    </div>
  )
}));

const messages = {
  Associate: 'Associate',
  'Associate 1 document': 'Associate 1 document',
  'Associate {nb} documents': 'Associate {nb} documents',
  'Detailed document view': 'Detailed document view',
  Reset: 'Reset',
  'Select documents with the checkboxes. Preview any document before associating it.':
    'Select documents',
  close: 'close'
};
const theme = createTheme();

const renderForm = ({ onSubmit, onSuccess }) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ThemeProvider theme={theme}>
        <SearchDocumentForm onSubmit={onSubmit} onSuccess={onSuccess} />
      </ThemeProvider>
    </IntlProvider>
  );

const selectDocument = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Select result' }));
};

describe('SearchDocumentForm submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets and closes only after a successful association', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onSuccess = vi.fn();
    renderForm({ onSubmit, onSuccess });
    selectDocument();

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
    selectDocument();

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
    selectDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Preview result' }));

    expect(await screen.findByTestId('document-preview')).toHaveTextContent(
      'Document 1, actions hidden: true'
    );
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
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

    fireEvent.click(screen.getByRole('button', { name: 'Preview result' }));

    expect(await screen.findByTestId('document-preview')).toHaveTextContent(
      'Document 1, actions hidden: true'
    );
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: 'Associate 0 documents' })
    ).toBeDisabled();
  });
});
