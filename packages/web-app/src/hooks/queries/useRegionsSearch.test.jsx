import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiPost } from '../../api/client';
import { useRegionsSearch } from './useRegionsSearch';

vi.mock('../../api/client', () => ({
  apiPost: vi.fn()
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const wrapper = ({ children }) => (
  <QueryClientProvider
    client={
      new QueryClient({
        defaultOptions: { queries: { retry: false } }
      })
    }>
    {children}
  </QueryClientProvider>
);

wrapper.propTypes = { children: PropTypes.node };

it('searches for a non-empty query by default', async () => {
  apiPost.mockResolvedValue({ results: [{ iso: 'FR-ARA' }] });

  const { result } = renderHook(() => useRegionsSearch('  Auvergne  '), {
    wrapper
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(apiPost).toHaveBeenCalledWith(expect.any(String), {
    query: 'Auvergne'
  });
});

it('does not search when the caller disables the query', () => {
  const { result } = renderHook(
    () => useRegionsSearch('Auvergne', { enabled: false }),
    { wrapper }
  );

  expect(result.current.fetchStatus).toBe('idle');
  expect(apiPost).not.toHaveBeenCalled();
});
