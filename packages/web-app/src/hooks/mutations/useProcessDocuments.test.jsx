import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiPut } from '@/api/client';
import {
  countKeys,
  documentKeys,
  entranceKeys,
  massifKeys,
  organizationKeys,
  personKeys
} from '@/api/queryKeys';
import { processDocumentIdsUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useProcessDocuments } from './useProcessDocuments';

vi.mock('@/api/client', () => ({ apiPut: vi.fn() }));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('useProcessDocuments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates every detail domain that embeds validated documents', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue();
    const results = [
      { id: 12, status: 'validated', reason: null },
      { id: 13, status: 'error', reason: 'Internal error' }
    ];
    apiPut.mockResolvedValue(results);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useProcessDocuments({ onSuccess }), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({
        ids: [12, 13],
        isValidated: true,
        comment: 'validated'
      });
    });

    expect(apiPut).toHaveBeenCalledWith(processDocumentIdsUrl, {
      documents: [
        { id: 12, isValidated: 'true', validationComment: 'validated' },
        { id: 13, isValidated: 'true', validationComment: 'validated' }
      ]
    });
    expect(onSuccess).toHaveBeenCalledWith(results, {
      ids: [12, 13],
      isValidated: true,
      comment: 'validated'
    });
    [
      countKeys.pendingDocuments(),
      documentKeys.all,
      entranceKeys.all,
      massifKeys.all,
      organizationKeys.all,
      personKeys.all
    ].forEach(queryKey => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey });
    });

    queryClient.clear();
  });

  it('does not retry transport failures even if the client enables retries', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({
      mutations: { retry: 3, retryDelay: 0 }
    });
    const error = new TypeError('Network error');
    apiPut.mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useProcessDocuments({ onError }), {
      wrapper: makeWrapper(queryClient)
    });
    const variables = { ids: [12], isValidated: true, comment: '' };
    await act(async () => {
      await expect(result.current.mutateAsync(variables)).rejects.toThrow(
        'Network error'
      );
    });
    expect(apiPut).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      error,
      variables,
      undefined,
      expect.anything()
    );
    queryClient.clear();
  });
});
