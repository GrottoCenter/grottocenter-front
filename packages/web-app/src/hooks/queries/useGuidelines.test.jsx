import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiGet, apiGetWithRange } from '../../api/client';
import { useGuideline, useGuidelines } from './useGuidelines';

vi.mock('../../api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn()
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

it('uses server pagination and preserves the Content-Range total', async () => {
  apiGetWithRange.mockResolvedValue({
    data: [
      { id: 1, title: 'Public', isDeleted: false },
      { id: 2, title: 'Deleted', isDeleted: true }
    ],
    contentRange: '20-21/126'
  });

  const { result } = renderHook(() => useGuidelines({ limit: 20, skip: 20 }), {
    wrapper
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(apiGetWithRange).toHaveBeenCalledWith(
    expect.stringContaining('limit=20&skip=20')
  );
  expect(result.current.data).toEqual({
    guidelines: [
      { id: 1, title: 'Public', isDeleted: false },
      { id: 2, title: 'Deleted', isDeleted: true }
    ],
    totalCount: 126
  });
});

it('caps the requested page size at the API maximum', async () => {
  apiGetWithRange.mockResolvedValue({ data: [], contentRange: '0-0/0' });

  const { result } = renderHook(() => useGuidelines({ limit: 200 }), {
    wrapper
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(apiGetWithRange).toHaveBeenCalledWith(
    expect.stringContaining('limit=100')
  );
});

it('uses the dedicated detail endpoint when it is available', async () => {
  apiGet.mockResolvedValue({ id: 42, title: 'Access' });

  const { result } = renderHook(() => useGuideline(42), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(apiGet).toHaveBeenCalledWith(expect.stringMatching(/guidelines\/42$/));
  expect(apiGetWithRange).not.toHaveBeenCalled();
  expect(result.current.data.title).toBe('Access');
});

it('surfaces detail endpoint errors without scanning the paginated list', async () => {
  apiGet.mockRejectedValue({ status: 404 });

  const { result } = renderHook(() => useGuideline(126), { wrapper });
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(apiGetWithRange).not.toHaveBeenCalled();
  expect(result.current.error).toEqual({ status: 404 });
});
