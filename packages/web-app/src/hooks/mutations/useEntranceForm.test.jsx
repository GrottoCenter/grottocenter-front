import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useEntrance } from '../queries/useEntrance';
import { useUpdateEntrance } from './useEntranceForm';
import { useUpdateCaveAndEntrance } from './useCaveForm';

vi.mock('@/api/client', () => ({ apiGet: vi.fn(), apiPut: vi.fn() }));
vi.mock('@/utils/mapTileCache', () => ({
  invalidateAll: vi.fn(),
  invalidateTileAt: vi.fn()
}));

afterEach(() => vi.resetAllMocks());

it.each([false, true])(
  'publishes the updated detail without a redundant GET (combined: %s)',
  async combined => {
    const queryClient = createTestQueryClient();
    const original = { id: 1, documents: [], featuredFile: null };
    const updated = {
      ...original,
      featuredFile: { id: 10, fileName: 'cave.jpg', completePath: '/cave.jpg' }
    };
    apiGet.mockResolvedValue(original);
    apiPut.mockImplementation(url =>
      Promise.resolve(url.includes('/entrances/') ? updated : { id: 2 })
    );
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () => ({
        entrance: useEntrance(1),
        updateEntrance: useUpdateEntrance(),
        updateBoth: useUpdateCaveAndEntrance()
      }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.entrance.isSuccess).toBe(true));
    await act(async () => {
      if (combined)
        await result.current.updateBoth.mutateAsync({
          caveData: { id: 2 },
          entranceData: { id: 1, featuredFile: 10 }
        });
      else
        await result.current.updateEntrance.mutateAsync({
          id: 1,
          featuredFile: 10
        });
    });
    expect(queryClient.getQueryData(entranceKeys.detail('1'))).toEqual(updated);
    await waitFor(() =>
      expect(result.current.entrance.data.featuredFile?.id).toBe(10)
    );
    expect(apiGet).toHaveBeenCalledTimes(1);
    unmount();
    queryClient.clear();
  }
);
