import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { apiGetWithRange } from '@/api/client';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';
import { useDeletedEntityCounts } from './useDeletedEntityCounts';

vi.mock('@/api/client', () => ({ apiGetWithRange: vi.fn() }));

const resources = Object.keys(DELETED_ENTITY_RESOURCES);
const renderCounts = enabled => {
  const queryClient = createTestQueryClient();
  return renderHook(() => useDeletedEntityCounts({ enabled }), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  });
};

beforeEach(() => {
  vi.resetAllMocks();
});

it('reads all deleted totals using minimal pages, including empty resources', async () => {
  apiGetWithRange.mockImplementation(url => {
    const resource = new URL(url).pathname.split('/').pop();
    const total = resources.indexOf(resource);
    return Promise.resolve({
      data: {
        [resource]: total ? [{ id: 42, isDeleted: true }] : []
      },
      contentRange: total ? `0-1/${total}` : null
    });
  });
  const { result } = renderCounts(true);
  await waitFor(() =>
    expect(result.current.every(query => query.isSuccess)).toBe(true)
  );
  expect(result.current.map(query => query.data.totalCount)).toEqual([
    0, 1, 2, 3, 4, 5
  ]);
  expect(apiGetWithRange).toHaveBeenCalledTimes(6);
  apiGetWithRange.mock.calls.forEach(([url]) => {
    const params = new URL(url).searchParams;
    expect(params.get('isDeleted')).toBe('true');
    expect(params.get('limit')).toBe('1');
    expect(params.get('skip')).toBe('0');
  });
});

it('does not contact the API when disabled', () => {
  renderCounts(false);
  expect(apiGetWithRange).not.toHaveBeenCalled();
});
