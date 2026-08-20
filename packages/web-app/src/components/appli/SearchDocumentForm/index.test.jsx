import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

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
  default: ({ onSelected }) => (
    <button
      type="button"
      onClick={() => onSelected([1], [{ id: 1, title: 'Document' }])}>
      Select result
    </button>
  )
}));

const messages = {
  Associate: 'Associate',
  'Associate 1 document': 'Associate 1 document',
  'Associate {nb} documents': 'Associate {nb} documents',
  Reset: 'Reset',
  'Select document(s) by clicking on the result table above.':
    'Select documents'
};

const renderForm = ({ onSubmit, onSuccess }) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SearchDocumentForm onSubmit={onSubmit} onSuccess={onSuccess} />
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
});
