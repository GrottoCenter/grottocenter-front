import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPatch, apiPut } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { moveHistoryRelevanceUrl, putHistoryUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useMoveHistoryRelevance, useUpdateHistory } from './useHistory';

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

describe('history mutations', () => {
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

  it('updates a history with PUT and refreshes entrance details', async () => {
    apiPut.mockResolvedValue(null);
    const { result } = renderHook(() => useUpdateHistory(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 42,
        title: 'Discovery',
        body: 'Updated history',
        language: 'eng'
      });
    });

    expect(apiPut).toHaveBeenCalledWith(putHistoryUrl(42), {
      title: 'Discovery',
      body: 'Updated history',
      language: 'eng'
    });
    expect(apiPatch).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.all
    });
  });

  it('moves a history with PATCH and refreshes entrance details', async () => {
    apiPatch.mockResolvedValue(null);
    const { result } = renderHook(() => useMoveHistoryRelevance(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 42, direction: 1 });
    });

    expect(apiPatch).toHaveBeenCalledWith(moveHistoryRelevanceUrl(42), {
      direction: 1
    });
    expect(apiPut).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.all
    });
  });
});
