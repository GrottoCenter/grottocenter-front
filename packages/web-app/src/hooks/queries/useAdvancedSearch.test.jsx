import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

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
