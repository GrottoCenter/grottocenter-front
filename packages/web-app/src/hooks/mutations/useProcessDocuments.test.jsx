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
  it('invalidates every detail domain that embeds validated documents', async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue();
    apiPut.mockResolvedValue(null);
    const { result } = renderHook(() => useProcessDocuments(), {
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
});
