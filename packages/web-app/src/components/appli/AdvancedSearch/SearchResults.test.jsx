import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import messages from '@/../public/lang/en.json';
import { useAdvancedSearch, useOnlineStatus } from '@/hooks';
import SearchResults from './SearchResults';

vi.mock('@/hooks', () => ({
  useAdvancedSearch: vi.fn(),
  useOnlineStatus: vi.fn(),
  refineAdvancedSearch: vi.fn()
}));

vi.mock('@/components/common/EntityTable', () => ({
  default: ({ pageRows }) =>
    pageRows?.map(row => <span key={row.id}>{row.name}</span>)
}));

const renderResults = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SearchResults entityType="entrances" />
    </IntlProvider>
  );

describe('SearchResults connection and failure states', () => {
  let query;

  beforeEach(() => {
    query = {
      params: { entity: 'entrances' },
      data: { results: [{ id: 1, name: 'Saved entrance' }], totalResults: 1 },
      fetchStatus: 'idle',
      refetch: vi.fn()
    };
    useAdvancedSearch.mockImplementation(() => query);
    useOnlineStatus.mockReturnValue(true);
  });

  it('keeps available results visible next to the offline explanation', () => {
    useOnlineStatus.mockReturnValue(false);
    renderResults();
    expect(screen.getByTestId('offline-search-state')).toHaveTextContent(
      messages.offlineSearchUnavailable
    );
    expect(screen.getByText('Saved entrance')).toBeVisible();
    expect(screen.queryByText(messages.Retry)).not.toBeInTheDocument();
  });

  it('keeps the table mounted but hides another page used as a paused placeholder', () => {
    query.fetchStatus = 'paused';
    query.isPlaceholderData = true;
    const { rerender } = renderResults();
    const row = screen.getByText('Saved entrance');
    expect(row).not.toBeVisible();
    expect(screen.getByTestId('offline-search-state')).toBeVisible();

    query.fetchStatus = 'fetching';
    rerender(
      <IntlProvider locale="en" messages={messages}>
        <SearchResults entityType="entrances" />
      </IntlProvider>
    );
    expect(screen.getByText('Saved entrance')).toBe(row);
    expect(row).toBeVisible();
  });

  it('offers retry for a network failure while online', () => {
    query.isError = true;
    query.error = new TypeError('Failed to fetch');
    renderResults();
    expect(
      screen.queryByTestId('offline-search-state')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: messages.Retry }));
    expect(query.refetch).toHaveBeenCalledTimes(1);
  });

  it('preserves a real HTTP error even after disconnecting', () => {
    query.isError = true;
    query.error = { status: 500 };
    useOnlineStatus.mockReturnValue(false);
    renderResults();
    expect(screen.getByTestId('fetch-error-state')).toHaveTextContent(
      messages['unexpected error']
    );
    expect(screen.queryByText(messages.Retry)).not.toBeInTheDocument();
  });
});
