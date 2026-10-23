import { act, renderHook, waitFor } from '@testing-library/react';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiDelete, apiPost, apiPut } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { deleteEntranceUrl, deleteLocationUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useDeleteComment } from './useComment';
import { useDeleteEntrance } from './useDeleteEntrance';
import {
  useDeleteHistory,
  useRestoreHistory,
  useUpdateHistory
} from './useHistory';
import { useDeleteLocation } from './useLocation';
import { useDeleteRigging } from './useRigging';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));
vi.mock('@/utils/mapTileCache', async importOriginal => ({
  ...(await importOriginal()),
  invalidateAll: vi.fn()
}));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('shared entrance content mutations', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
    vi.resetAllMocks();
  });

  it.each([
    ['comment', useDeleteComment],
    ['history', useDeleteHistory],
    ['location', useDeleteLocation],
    ['rigging', useDeleteRigging]
  ])(
    'propagates %s deletion failures to their inline owner',
    async (_name, useDelete) => {
      const failure = new Error('Deletion rejected');
      apiDelete.mockRejectedValue(failure);
      const onError = vi.fn();
      queryClient = new QueryClient({
        mutationCache: new MutationCache({ onError }),
        defaultOptions: { mutations: { retry: false } }
      });
      const { result } = renderHook(() => useDelete(), {
        wrapper: makeWrapper(queryClient)
      });
      const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await expect(
          result.current.mutateAsync({ id: 42, isPermanent: false })
        ).rejects.toBe(failure);
      });

      await waitFor(() => expect(result.current.error).toBe(failure));
      expect(onError).toHaveBeenCalledWith(
        failure,
        { id: 42, isPermanent: false },
        undefined,
        expect.objectContaining({
          meta: { errorPresentation: 'inline' }
        }),
        expect.anything()
      );
      expect(invalidateQueries).not.toHaveBeenCalled();
    }
  );

  it('keeps an update pending until entrance refresh completes', async () => {
    apiPut.mockResolvedValue(null);
    let finishRefresh;
    const refresh = new Promise(resolve => {
      finishRefresh = resolve;
    });
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockReturnValue(refresh);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useUpdateHistory(), {
      wrapper: makeWrapper(queryClient)
    });
    let update;
    act(() => {
      update = result.current.mutateAsync({ id: 42 }).then(onSuccess);
    });
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: entranceKeys.all
      })
    );
    expect(result.current.isPending).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();

    await act(async () => {
      finishRefresh();
      await update;
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it.each([
    ['deletion', useDeleteHistory],
    ['restoration', useRestoreHistory]
  ])(
    'completes %s without awaiting entrance refresh',
    async (_name, useWrite) => {
      apiDelete.mockResolvedValue(null);
      apiPost.mockResolvedValue(null);
      let finishRefresh;
      const refresh = new Promise(resolve => {
        finishRefresh = resolve;
      });
      const invalidateQueries = vi
        .spyOn(queryClient, 'invalidateQueries')
        .mockReturnValue(refresh);
      const { result } = renderHook(() => useWrite(), {
        wrapper: makeWrapper(queryClient)
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 42, isPermanent: false });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: entranceKeys.all
      });
      finishRefresh();
    }
  );

  it.each([false, true])(
    'keeps location and entrance deletion separate (permanent: %s)',
    async isPermanent => {
      apiDelete.mockResolvedValue(null);
      const entrance = { id: 7, name: 'Original entrance', isDeleted: false };
      queryClient.setQueryData(entranceKeys.detail(7), entrance);
      const { result } = renderHook(
        () => ({
          location: useDeleteLocation(),
          entrance: useDeleteEntrance()
        }),
        { wrapper: makeWrapper(queryClient) }
      );

      await act(async () => {
        await result.current.location.mutateAsync({ id: 42, isPermanent });
      });
      expect(apiDelete).toHaveBeenLastCalledWith(
        deleteLocationUrl(42, isPermanent)
      );
      expect(queryClient.getQueryData(entranceKeys.detail(7))).toEqual(
        entrance
      );

      await act(async () => {
        await result.current.entrance.mutateAsync({
          id: 7,
          entityId: 8,
          isPermanent
        });
      });
      expect(apiDelete).toHaveBeenLastCalledWith(
        deleteEntranceUrl(7, { entityId: 8, isPermanent })
      );
      if (isPermanent) {
        expect(
          queryClient.getQueryData(entranceKeys.detail(7))
        ).toBeUndefined();
      } else {
        expect(queryClient.getQueryData(entranceKeys.detail(7))).toEqual({
          ...entrance,
          isDeleted: true,
          redirectTo: 8
        });
      }
      expect(apiDelete).toHaveBeenCalledTimes(2);
    }
  );
});
