import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPatch, apiPut } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { moveLocationRelevanceUrl, putLocationUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useMoveLocationRelevance, useUpdateLocation } from './useLocation';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('location mutations', () => {
  let queryClient;
  let invalidateQueries;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('updates a location with PUT and refreshes entrance details', async () => {
    apiPut.mockResolvedValue(null);
    const { result } = renderHook(() => useUpdateLocation(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 11364,
        title: 'Test',
        body: 'Test edit actions 2',
        language: 'fra'
      });
    });

    expect(apiPut).toHaveBeenCalledWith(putLocationUrl(11364), {
      title: 'Test',
      body: 'Test edit actions 2',
      language: 'fra'
    });
    expect(apiPatch).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.all
    });
  });

  it('moves a location with PATCH and refreshes entrance details', async () => {
    apiPatch.mockResolvedValue(null);
    const { result } = renderHook(() => useMoveLocationRelevance(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 11364, direction: -1 });
    });

    expect(apiPatch).toHaveBeenCalledWith(moveLocationRelevanceUrl(11364), {
      direction: -1
    });
    expect(apiPut).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.all
    });
  });
});
