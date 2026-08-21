import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { createTestQueryClient } from '../../test/renderWithProviders';
import useProjections from './useProjections';
import * as apiClient from '../../api/client';
import * as coordinateTransform from '../../helpers/coordinateTransform';

/**
 * Regression: pre-migration the /api/convert endpoint could enter a tight
 * retry loop when the guard checked `data === null && !loading` instead of
 * `error`. React Query caches the error, so a single failure must NOT lead
 * to a second queryFn call on its own.
 */
describe('useProjections (regression: no retry storm)', () => {
  let queryClient;
  const makeWrapper = client => {
    const Wrapper = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    Wrapper.propTypes = { children: PropTypes.node };
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.spyOn(coordinateTransform, 'registerProjections').mockImplementation(
      () => {}
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not re-fetch after an error (single call on failure)', async () => {
    const apiGetSpy = vi
      .spyOn(apiClient, 'apiGet')
      .mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }));

    const { result } = renderHook(() => useProjections(), {
      wrapper: makeWrapper(queryClient)
    });

    await waitFor(() => {
      expect(apiGetSpy).toHaveBeenCalled();
    });
    // Even after the error settles, no auto-retry — the query cache holds
    // the failure. (retry:false on the test client.)
    await new Promise(r => {
      setTimeout(r, 20);
    });
    expect(apiGetSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual([]);
  });

  it('calls registerProjections exactly once on success', async () => {
    vi.spyOn(apiClient, 'apiGet').mockResolvedValue([
      { id: 1, code: 'EPSG:4326' }
    ]);

    const { result } = renderHook(() => useProjections(), {
      wrapper: makeWrapper(queryClient)
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
    expect(coordinateTransform.registerProjections).toHaveBeenCalledTimes(1);
  });
});
