import {
  fetchAllNetworksCoordinates,
  FETCH_MAP_START_LOADING,
  FETCH_MAP_END_LOADING,
  FETCH_MAP_NETWORKS_COORDINATES_SUCCESS,
  FETCH_MAP_NETWORKS_COORDINATES_FAILURE,
  LOADINGS
} from './Map';

describe('fetchAllNetworksCoordinates retry policy', () => {
  const mockFetch = vi.fn();
  const dispatch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    dispatch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const expectFailure = message => {
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      {
        type: FETCH_MAP_START_LOADING,
        key: LOADINGS.NETWORKS_COORDINATES
      },
      {
        type: FETCH_MAP_NETWORKS_COORDINATES_FAILURE,
        error: { type: message, message: 'Fetching all networks coordinates' }
      },
      {
        type: FETCH_MAP_END_LOADING,
        key: LOADINGS.NETWORKS_COORDINATES
      }
    ]);
  };

  it.each([404, 408, 429])(
    'makes one request for HTTP %i and ends loading',
    async status => {
      mockFetch.mockResolvedValue({ status });

      await fetchAllNetworksCoordinates()(dispatch);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
      expectFailure(String(status));
    }
  );

  it.each(['HTTP 503', 'network error'])(
    'retries %s three times with exponential backoff and ends loading',
    async failure => {
      const message = failure === 'HTTP 503' ? '503' : 'Failed to fetch';
      if (failure === 'HTTP 503') {
        mockFetch.mockResolvedValue({ status: 503 });
      } else {
        mockFetch.mockRejectedValue(new TypeError(message));
      }

      const request = fetchAllNetworksCoordinates()(dispatch);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(999);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1999);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(3999);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      await request;

      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(vi.getTimerCount()).toBe(0);
      expectFailure(message);
    }
  );

  it('stops retrying when a transient failure is followed by a 429', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValue({ status: 429 });

    const request = fetchAllNetworksCoordinates()(dispatch);
    await vi.runAllTimersAsync();
    await request;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expectFailure('429');
  });

  it('does not retry network failures while offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await fetchAllNetworksCoordinates()(dispatch);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expectFailure('Failed to fetch');
  });

  it('dispatches coordinates and ends loading after a successful retry', async () => {
    const coordinates = [[6.5, 45.5]];
    mockFetch.mockResolvedValueOnce({ status: 503 }).mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify(coordinates)
    });

    const request = fetchAllNetworksCoordinates()(dispatch);
    await vi.runAllTimersAsync();
    await request;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith({
      type: FETCH_MAP_NETWORKS_COORDINATES_SUCCESS,
      data: coordinates
    });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: FETCH_MAP_END_LOADING,
      key: LOADINGS.NETWORKS_COORDINATES
    });
    expect(dispatch.mock.calls.map(([action]) => action.type)).not.toContain(
      FETCH_MAP_NETWORKS_COORDINATES_FAILURE
    );
  });
});
