import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiGet } from '@/api/client';
import { pointsUrl, pointUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { usePoint, usePoints } from './usePoints';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

let queryClient;
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
Wrapper.propTypes = { children: PropTypes.node.isRequired };

beforeEach(() => {
  queryClient = createTestQueryClient();
  vi.resetAllMocks();
});

afterEach(() => queryClient.clear());

it('loads every API page, including the final partial page, for local search', async () => {
  const first = Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }));
  const last = [{ id: 101, label: 'Last point', underground: null }];
  apiGet
    .mockResolvedValueOnce({ points: first, total: 101, page: 1, size: 100 })
    .mockResolvedValueOnce({ points: last, total: 101, page: 2, size: 100 });

  const { result } = renderHook(() => usePoints(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(result.current.data).toEqual([...first, ...last]);
  expect(apiGet.mock.calls).toEqual([
    [`${pointsUrl}?page=1&size=100`],
    [`${pointsUrl}?page=2&size=100`]
  ]);
});

it('does not present the first page as a complete list if a later page fails', async () => {
  apiGet
    .mockResolvedValueOnce({ points: [{ id: 1 }], total: 101 })
    .mockRejectedValueOnce(new Error('Second page failed'));
  const { result } = renderHook(() => usePoints(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.data).toBeUndefined();
});

it('handles an empty catalogue without requesting another page', async () => {
  apiGet.mockResolvedValue({ points: [], total: 0 });
  const { result } = renderHook(() => usePoints(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([]);
  expect(apiGet).toHaveBeenCalledTimes(1);
});

it('loads the detail independently of the catalogue and preserves zero coordinates', async () => {
  const point = { id: 5, underground: false, latitude: 0, longitude: 0 };
  apiGet.mockResolvedValue(point);
  const { result } = renderHook(() => usePoint('5'), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(apiGet).toHaveBeenCalledWith(pointUrl(5));
  expect(result.current.data).toEqual(point);
});
