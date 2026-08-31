import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiGetWithRange } from '../../api/client';
import { useGuidelines } from './useGuidelines';

vi.mock('../../api/client', () => ({ apiGetWithRange: vi.fn() }));

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

it('uses server pagination, Content-Range and excludes deleted rows', async () => {
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
    guidelines: [{ id: 1, title: 'Public', isDeleted: false }],
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
