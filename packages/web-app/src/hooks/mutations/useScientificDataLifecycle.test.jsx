import { QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { pointKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { invalidateAll } from '@/utils/mapTileCache';
import {
  useMoveEntranceToCave,
  useDetachEntranceToNewCave
} from './useAdminActions';
import { useDeleteCave } from './useDeleteCave';
import { useDeleteEntrance } from './useDeleteEntrance';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn()
}));
vi.mock('@/utils/mapTileCache', () => ({ invalidateAll: vi.fn() }));

let queryClient;
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
Wrapper.propTypes = { children: PropTypes.node.isRequired };

const operations = [
  ['move', useMoveEntranceToCave, { entranceId: 1, caveId: 20 }],
  ['detach', useDetachEntranceToNewCave, { id: 1, name: 'Entrance' }],
  ...[
    ['cave', useDeleteCave],
    ['entrance', useDeleteEntrance]
  ].flatMap(([entity, useMutation]) => [
    [`soft-delete ${entity}`, useMutation, { id: 1, isPermanent: false }],
    [
      `merge ${entity}`,
      useMutation,
      { id: 1, isPermanent: true, entityId: 20 }
    ],
    [`permanently delete ${entity}`, useMutation, { id: 1, isPermanent: true }]
  ])
];

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = createTestQueryClient();
  queryClient.setQueryDefaults(pointKeys.all, { staleTime: Infinity });
  apiPost.mockResolvedValue({ id: 20 });
  apiPatch.mockResolvedValue(null);
  apiDelete.mockResolvedValue(null);
});

afterEach(() => queryClient.clear());

it.each(operations)(
  '%s refreshes mounted point details and invalidates cached point collections',
  async (_operation, useMutation, variables) => {
    const originalPoint = { id: 7, caveId: 10 };
    const detailKey = pointKeys.detail(7);
    const collectionKeys = [
      pointKeys.list(),
      pointKeys.coordinates(),
      ...[10, 20].map(networkId =>
        pointKeys.associated({ networkId, page: 1, size: 20 })
      )
    ];
    queryClient.setQueryData(detailKey, originalPoint);
    collectionKeys.forEach(key =>
      queryClient.setQueryData(key, { points: [originalPoint] })
    );
    // An active point page must refetch even when its cache was still fresh.
    // The API owns the new association; the mutation must never guess it.
    const updatedPoint = { id: 7, caveId: null };
    const fetchPoint = vi.fn().mockResolvedValue(updatedPoint);
    const observer = new QueryObserver(queryClient, {
      queryKey: detailKey,
      queryFn: fetchPoint
    });
    const unsubscribe = observer.subscribe(() => {});
    const { result } = renderHook(() => useMutation(), { wrapper: Wrapper });

    try {
      expect(fetchPoint).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.mutateAsync(variables);
      });
      expect(fetchPoint).toHaveBeenCalledOnce();
      expect(queryClient.getQueryData(detailKey)).toEqual(updatedPoint);
      collectionKeys.forEach(key =>
        expect(queryClient.getQueryState(key).isInvalidated).toBe(true)
      );
      expect(invalidateAll).toHaveBeenCalledWith('points', {
        discardData: true
      });
    } finally {
      unsubscribe();
    }
  }
);

it.each(operations)(
  '%s leaves point caches unchanged when the operation fails',
  async (_operation, useMutation, variables) => {
    const failure = new Error('Operation failed');
    apiPatch.mockRejectedValue(failure);
    apiDelete.mockRejectedValue(failure);
    const point = { id: 7, caveId: 10 };
    const key = pointKeys.detail(7);
    queryClient.setQueryData(key, point);
    const { result } = renderHook(() => useMutation(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(variables)).rejects.toBe(failure);
    });
    expect(queryClient.getQueryData(key)).toEqual(point);
    expect(queryClient.getQueryState(key).isInvalidated).toBe(false);
    expect(invalidateAll).not.toHaveBeenCalled();
  }
);
