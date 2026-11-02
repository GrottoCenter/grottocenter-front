import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager
} from '@tanstack/react-query';
import PropTypes from 'prop-types';

import productionQueryClient from '@/conf/queryClient';
import { createTestQueryClient } from '../../test/renderWithProviders';
import {
  useAdvancedSearch,
  startAdvancedSearch,
  refineAdvancedSearch,
  resetAdvancedSearch
} from './useAdvancedSearch';
import * as apiClient from '../../api/client';

// The singleton state lives at module scope; every test must reset it
// through the exported resetter, otherwise a previous case's `params` leaks
// in and enables the query on mount.
const makeWrapper = client => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node };
  return Wrapper;
};

describe('useAdvancedSearch (module singleton semantics)', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    resetAdvancedSearch();
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({ results: [] });
  });

  afterEach(() => {
    resetAdvancedSearch();
    vi.restoreAllMocks();
  });

  it('is disabled until startAdvancedSearch supplies params with an entity', () => {
    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });
    expect(result.current.params).toBe(null);
    expect(apiClient.apiPost).not.toHaveBeenCalled();
  });

  it('fires the query with isNewQuery=true after startAdvancedSearch', async () => {
    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });

    act(() => {
      startAdvancedSearch({ entity: 'cave', name: 'test' });
    });

    await waitFor(() => {
      expect(apiClient.apiPost).toHaveBeenCalledTimes(1);
    });
    expect(result.current.params).toEqual({ entity: 'cave', name: 'test' });
    // isNewQuery flips back to false via the effect once fetching settles,
    // matching the legacy reducer's FETCH_ADVANCEDSEARCH_SUCCESS behaviour.
    await waitFor(() => {
      expect(result.current.isNewQuery).toBe(false);
    });
  });

  it('refineAdvancedSearch keeps isNewQuery=false so table state is not reset', async () => {
    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });

    act(() => {
      refineAdvancedSearch({ entity: 'cave', name: 'a', page: 2 });
    });

    await waitFor(() => {
      expect(result.current.params).toEqual({
        entity: 'cave',
        name: 'a',
        page: 2
      });
    });
    expect(result.current.isNewQuery).toBe(false);
  });

  it('keeps the current results while a refined page is loading', async () => {
    const firstPage = {
      results: [{ id: 1, name: 'First page' }],
      totalResults: 5609
    };
    const secondPage = {
      results: [{ id: 201, name: 'Second page' }],
      totalResults: 5609
    };
    let resolveSecondPage;
    apiClient.apiPost.mockResolvedValueOnce(firstPage).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSecondPage = resolve;
        })
    );

    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });

    act(() => {
      startAdvancedSearch({ entity: 'documents', page: 1, size: 200 });
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(firstPage);
    });

    act(() => {
      refineAdvancedSearch({ entity: 'documents', page: 2, size: 200 });
    });
    await waitFor(() => {
      expect(apiClient.apiPost).toHaveBeenCalledTimes(2);
    });

    expect(result.current.data).toEqual(firstPage);
    expect(result.current.isPlaceholderData).toBe(true);

    await act(async () => {
      resolveSecondPage(secondPage);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(secondPage);
    });
    expect(result.current.isPlaceholderData).toBe(false);
  });

  it('shares state across two independent consumers (singleton contract)', async () => {
    const wrapper = makeWrapper(queryClient);
    const a = renderHook(() => useAdvancedSearch(), { wrapper });
    const b = renderHook(() => useAdvancedSearch(), { wrapper });

    act(() => {
      startAdvancedSearch({ entity: 'entrance' });
    });

    await waitFor(() => {
      expect(a.result.current.params).toEqual({ entity: 'entrance' });
      expect(b.result.current.params).toEqual({ entity: 'entrance' });
    });
  });
});

describe('useAdvancedSearch offline lifecycle', () => {
  let queryClient;
  let onlineStatus;

  const setConnectivity = isOnline => {
    onlineStatus.mockReturnValue(isOnline);
    act(() => {
      window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
    });
  };

  beforeEach(() => {
    onlineManager.setOnline(true);
    onlineStatus = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          ...productionQueryClient.getDefaultOptions().queries,
          retryDelay: 0,
          gcTime: Infinity
        }
      }
    });
    resetAdvancedSearch();
    vi.spyOn(apiClient, 'apiPost').mockResolvedValue({ results: [] });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    resetAdvancedSearch();
    onlineManager.setOnline(true);
    vi.restoreAllMocks();
  });

  it.each(['entrances', 'documents'])(
    'defers an offline %s search until reconnection, even if Query thinks it is online',
    async entity => {
      onlineStatus.mockReturnValue(false);
      const params = { entity, query: 'test', page: 1 };
      startAdvancedSearch(params);
      const { result } = renderHook(() => useAdvancedSearch(), {
        wrapper: makeWrapper(queryClient)
      });

      expect(onlineManager.isOnline()).toBe(true);
      expect(apiClient.apiPost).not.toHaveBeenCalled();
      expect(result.current.isNewQuery).toBe(true);

      setConnectivity(true);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiClient.apiPost).toHaveBeenCalledExactlyOnceWith(
        expect.any(String),
        params
      );
      expect(result.current.isNewQuery).toBe(false);
    }
  );

  it('keeps cached results and defers offline refinements and new searches', async () => {
    const data = { results: [{ id: 1 }], totalResults: 40 };
    apiClient.apiPost.mockResolvedValue(data);
    startAdvancedSearch({ entity: 'entrances', page: 1 });
    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });
    await waitFor(() => expect(result.current.data).toEqual(data));

    setConnectivity(false);
    expect(result.current.data).toEqual(data);

    act(() => refineAdvancedSearch({ entity: 'entrances', page: 2 }));
    // The view hides this placeholder offline while keeping its controls mounted.
    expect(result.current.data).toEqual(data);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(apiClient.apiPost).toHaveBeenCalledTimes(1);

    act(() => startAdvancedSearch({ entity: 'entrances', query: 'new' }));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isNewQuery).toBe(true);

    setConnectivity(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.apiPost).toHaveBeenCalledTimes(2);
    expect(apiClient.apiPost).toHaveBeenLastCalledWith(expect.any(String), {
      entity: 'entrances',
      query: 'new'
    });
  });

  it('pauses an in-flight failure and resumes its retry once on reconnect', async () => {
    let rejectRequest;
    apiClient.apiPost.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        })
    );
    startAdvancedSearch({ entity: 'documents', query: 'test' });
    const { result } = renderHook(() => useAdvancedSearch(), {
      wrapper: makeWrapper(queryClient)
    });
    await waitFor(() => expect(apiClient.apiPost).toHaveBeenCalledTimes(1));

    setConnectivity(false);
    act(() => rejectRequest(new TypeError('Failed to fetch')));
    await waitFor(() => expect(result.current.fetchStatus).toBe('paused'));
    expect(result.current.isNewQuery).toBe(true);
    expect(result.current.error).toBeNull();

    setConnectivity(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.apiPost).toHaveBeenCalledTimes(2);
    expect(result.current.isNewQuery).toBe(false);
  });
});
