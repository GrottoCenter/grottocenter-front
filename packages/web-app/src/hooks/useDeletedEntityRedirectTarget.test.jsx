import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiGet } from '@/api/client';
import { useDeletedEntityRedirectTarget } from './useDeletedEntityRedirectTarget';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

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

beforeEach(() => vi.resetAllMocks());

it.each([
  ['Document', 'documents'],
  ['Entrance', 'entrances'],
  ['Network', 'caves'],
  ['Massif', 'massifs'],
  ['Organization', 'organizations']
])(
  'loads only the %s target through its existing detail query',
  async (kind, path) => {
    apiGet.mockResolvedValue({ id: 43, name: 'Destination' });
    const { result } = renderHook(
      () => useDeletedEntityRedirectTarget(kind, 43),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(new RegExp(`/${path}/43$`))
    );
  }
);

it('preserves detail errors', async () => {
  apiGet.mockRejectedValue(new Error('Target not found'));
  const { result } = renderHook(
    () => useDeletedEntityRedirectTarget('Document', 43),
    { wrapper }
  );
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error.message).toBe('Target not found');
});
