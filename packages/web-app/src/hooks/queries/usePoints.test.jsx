import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiGet } from '@/api/client';
import {
  pointsUrl,
  pointUrl,
  pointPositionsUrl,
  getMapPointsCoordinatesUrl
} from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  useAssociatedPoints,
  usePoint,
  usePointPositions,
  usePoints,
  useSurfacePointCoordinates
} from './usePoints';

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

it('loads surface coordinates only after enabling the layer and excludes unclassified or invalid locations', async () => {
  apiGet.mockResolvedValue([
    [0, 0, false],
    [6, 45, false],
    [6, 45, true],
    [6, 45, null],
    [6, 45],
    [181, 45, false],
    [6, null, false]
  ]);
  const { result, rerender } = renderHook(
    ({ enabled }) => useSurfacePointCoordinates({ enabled }),
    { wrapper: Wrapper, initialProps: { enabled: false } }
  );
  expect(apiGet).not.toHaveBeenCalled();
  rerender({ enabled: true });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(apiGet).toHaveBeenCalledWith(
    `${getMapPointsCoordinatesUrl}?underground=false`,
    { signal: expect.any(AbortSignal) }
  );
  expect(result.current.data).toEqual([
    [0, 0],
    [6, 45]
  ]);
});

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

describe('point positioning documents', () => {
  it('loads one page of at most 100 positions without following additional pages', async () => {
    const response = {
      positions: Array.from({ length: 100 }, (_, index) => ({
        pointId: 5,
        documentId: index + 1,
        document: { id: index + 1, title: `Survey ${index + 1}` }
      })),
      total: 101,
      page: 1,
      size: 100
    };
    apiGet.mockResolvedValue(response);
    const { result, rerender } = renderHook(
      ({ enabled }) => usePointPositions(5, { enabled }),
      { wrapper: Wrapper, initialProps: { enabled: false } }
    );
    expect(apiGet).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(apiGet).toHaveBeenCalledExactlyOnceWith(
      `${pointPositionsUrl(5)}?page=1&size=100`
    );
  });

  it('keeps a failure available to the inline error and retry controls', async () => {
    apiGet.mockRejectedValue(new Error('Documents unavailable'));
    const { result } = renderHook(() => usePointPositions(5), {
      wrapper: Wrapper
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error.message).toBe('Documents unavailable');
  });

  it('never requests positions before a point id is known', () => {
    renderHook(() => usePointPositions(null), { wrapper: Wrapper });
    expect(apiGet).not.toHaveBeenCalled();
  });
});

describe('associated points', () => {
  it.each([
    ['entranceId', 'entrance', 101],
    ['networkId', 'network', 11]
  ])(
    'uses the future %s filter without requesting the legacy cave',
    async (filter, association, id) => {
      const response = {
        points: [
          { id: 7, [association]: { id }, underground: false },
          { id: 8, [association]: { id }, underground: true },
          { id: 9, [association]: { id }, underground: null }
        ],
        total: 23,
        page: 2,
        size: 20
      };
      apiGet.mockResolvedValue(response);
      const { result } = renderHook(
        () => useAssociatedPoints({ [filter]: id, legacyCaveId: 11, page: 2 }),
        { wrapper: Wrapper }
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(response);
      expect(apiGet).toHaveBeenCalledExactlyOnceWith(
        `${pointsUrl}?${filter}=${id}&page=2&size=20`
      );
    }
  );

  it('waits until the section is enabled before fetching its points', async () => {
    apiGet.mockResolvedValue({ points: [], total: 0, page: 1, size: 20 });
    const { result, rerender } = renderHook(
      ({ enabled }) => useAssociatedPoints({ entranceId: 101, enabled }),
      { wrapper: Wrapper, initialProps: { enabled: false } }
    );
    expect(apiGet).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('never fetches an unfiltered catalogue without an association', () => {
    renderHook(() => useAssociatedPoints({}), { wrapper: Wrapper });
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('discards a legacy unfiltered response and requests the cave-filtered page', async () => {
    const page = {
      points: [{ id: 7, caveId: 11, underground: null }],
      total: 21,
      page: 2,
      size: 20
    };
    apiGet
      .mockResolvedValueOnce({
        points: [{ id: 999, caveId: 99 }],
        total: 1000,
        page: 2,
        size: 20
      })
      .mockResolvedValueOnce(page);
    const { result } = renderHook(
      () => useAssociatedPoints({ entranceId: 101, legacyCaveId: 11, page: 2 }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(page);
    expect(apiGet.mock.calls).toEqual([
      [`${pointsUrl}?entranceId=101&page=2&size=20`],
      [`${pointsUrl}?caveId=11&page=2&size=20`]
    ]);
  });

  it('reports a failed legacy request without displaying the global catalogue', async () => {
    apiGet
      .mockResolvedValueOnce({ points: [{ id: 999, caveId: 99 }], total: 1 })
      .mockRejectedValueOnce(new Error('Legacy request failed'));
    const { result } = renderHook(
      () => useAssociatedPoints({ networkId: 11, legacyCaveId: 11 }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it.each([400, 401, 404, 429, 500])(
    'does not bypass a future API rejection with the legacy filter for HTTP %i',
    async status => {
      apiGet.mockRejectedValue(
        Object.assign(new Error('Rejected'), { status })
      );
      const { result } = renderHook(
        () => useAssociatedPoints({ entranceId: 101, legacyCaveId: 11 }),
        { wrapper: Wrapper }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBeUndefined();
    }
  );

  it.each([
    [{ id: 7, entrance: { id: 999 } }],
    [{ id: 7, network: { id: 11 } }]
  ])(
    'rejects unrelated modern points instead of showing a global catalogue',
    async point => {
      apiGet.mockResolvedValue({ points: [point], total: 1 });
      const { result } = renderHook(
        () => useAssociatedPoints({ entranceId: 101, legacyCaveId: 11 }),
        { wrapper: Wrapper }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
      expect(apiGet).toHaveBeenCalledTimes(1);
    }
  );

  it('rejects unrelated results even if the legacy cave filter is ignored', async () => {
    apiGet.mockResolvedValue({ points: [{ id: 999, caveId: 99 }], total: 1 });
    const { result } = renderHook(
      () => useAssociatedPoints({ networkId: 11, legacyCaveId: 11 }),
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('keeps entrance and network pages in separate cache entries', async () => {
    apiGet.mockImplementation(async url => {
      const params = new URL(url, 'https://example.com').searchParams;
      const id = Number(params.get('entranceId') ?? params.get('networkId'));
      const association = params.has('entranceId') ? 'entrance' : 'network';
      return {
        points: [{ id, [association]: { id } }],
        total: 1,
        page: 1,
        size: 20
      };
    });
    const { result, rerender } = renderHook(
      criteria => useAssociatedPoints(criteria),
      { wrapper: Wrapper, initialProps: { entranceId: 101 } }
    );
    await waitFor(() => expect(result.current.data?.points[0].id).toBe(101));
    rerender({ networkId: 11 });
    await waitFor(() => expect(result.current.data?.points[0].id).toBe(11));
    expect(apiGet).toHaveBeenCalledTimes(2);
  });
});
