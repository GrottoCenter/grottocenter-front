import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { resetAdvancedSearch } from '@/hooks';
import SearchEntranceForm from './index';

vi.mock('@/hooks', () => ({
  resetAdvancedSearch: vi.fn(),
  useOnlineStatus: () => true
}));

vi.mock('@/components/common/OfflineDisabled', () => ({
  default: ({ children }) => children
}));

vi.mock('../AdvancedSearch/EntrancesSearch', () => ({
  default: () => null
}));

vi.mock('../AdvancedSearch/SearchResults', () => ({
  default: ({ onSelected }) => (
    <>
      <button
        type="button"
        onClick={() => onSelected([1], [{ id: 1, name: 'First entrance' }])}>
        Select first
      </button>
      <button
        type="button"
        onClick={() => onSelected([2], [{ id: 2, name: 'Second entrance' }])}>
        Select second page
      </button>
    </>
  )
}));

const messages = {
  'Associate 1 entrance': 'Associate 1 entrance',
  'Associate {nb} entrances': 'Associate {nb} entrances',
  'Select entrances with the checkboxes to associate them.':
    'Select entrances with the checkboxes to associate them.',
  Reset: 'Reset'
};

const renderForm = (onSubmit, onSuccess = vi.fn()) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SearchEntranceForm onSubmit={onSubmit} onSuccess={onSuccess} />
    </IntlProvider>
  );

describe('SearchEntranceForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps selections across result pages and closes after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onSuccess = vi.fn();
    renderForm(onSubmit, onSuccess);
    fireEvent.click(screen.getByRole('button', { name: 'Select first' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select second page' }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Associate 2 entrances' })
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith([
      { id: 1, name: 'First entrance' },
      { id: 2, name: 'Second entrance' }
    ]);
    expect(resetAdvancedSearch).toHaveBeenCalledOnce();
  });

  it('retains the selection and stays open on failure', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('request failed'));
    const onSuccess = vi.fn();
    renderForm(onSubmit, onSuccess);
    fireEvent.click(screen.getByRole('button', { name: 'Select first' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Associate 1 entrance' })
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(resetAdvancedSearch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Associate 1 entrance' })
    ).toBeEnabled();
  });
});
