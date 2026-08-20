import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { apiDelete, apiPut } from '@/api/client';
import { documentKeys, entranceKeys, massifKeys } from '@/api/queryKeys';
import {
  associateDocumentToEntranceUrl,
  associateDocumentToMassifUrl
} from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  useLinkDocumentToEntrance,
  useLinkDocumentsToEntrance,
  useUnlinkDocumentToEntrance
} from './useLinkDocumentToEntrance';
import {
  useLinkDocumentsToMassif,
  useUnlinkDocumentToMassif
} from './useLinkDocumentToMassif';

vi.mock('@/api/client', () => ({
  apiDelete: vi.fn(),
  apiPut: vi.fn()
}));

const makeWrapper = queryClient => {
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.propTypes = { children: PropTypes.node.isRequired };
  return Wrapper;
};

describe('document association mutations', () => {
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

  it('refreshes an entrance and its document after linking', async () => {
    apiPut.mockResolvedValue(null);
    const { result } = renderHook(() => useLinkDocumentToEntrance(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({
        entranceId: 160325,
        document: { id: 234218 }
      });
    });

    expect(apiPut).toHaveBeenCalledWith(
      associateDocumentToEntranceUrl(160325, 234218)
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.detail('160325')
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: documentKeys.detail('234218')
    });
  });

  it('waits for every entrance link and refreshes the final state on partial failure', async () => {
    const failure = new Error('second document failed');
    apiPut
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(null);
    const { result } = renderHook(() => useLinkDocumentsToEntrance(), {
      wrapper: makeWrapper(queryClient)
    });
    const documents = [{ id: 1 }, { id: 2 }, { id: 3 }];
    let caughtError;

    await act(async () => {
      try {
        await result.current.mutateAsync({ entranceId: 42, documents });
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toBe(failure);
    expect(caughtError.rejections).toEqual([failure]);
    expect(apiPut).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.detail(42)
    });
    documents.forEach(document => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: documentKeys.detail(document.id)
      });
    });
  });

  it('exposes every rejection reason when several links fail', async () => {
    const first = new Error('first failed');
    const second = new Error('second failed');
    apiPut
      .mockRejectedValueOnce(first)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(second);
    const { result } = renderHook(() => useLinkDocumentsToEntrance(), {
      wrapper: makeWrapper(queryClient)
    });
    let caughtError;

    await act(async () => {
      try {
        await result.current.mutateAsync({
          entranceId: 42,
          documents: [{ id: 1 }, { id: 2 }, { id: 3 }]
        });
      } catch (error) {
        caughtError = error;
      }
    });

    expect(caughtError).toBe(first);
    expect(caughtError.rejections).toEqual([first, second]);
  });

  it('refreshes both sides after unlinking an entrance document', async () => {
    apiDelete.mockResolvedValue(null);
    const { result } = renderHook(() => useUnlinkDocumentToEntrance(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({ entranceId: 42, documentId: 7 });
    });

    expect(apiDelete).toHaveBeenCalledWith(
      associateDocumentToEntranceUrl(42, 7)
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: entranceKeys.detail(42)
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: documentKeys.detail(7)
    });
  });

  it('links several massif documents and invalidates once after the batch', async () => {
    apiPut.mockResolvedValue(null);
    const { result } = renderHook(() => useLinkDocumentsToMassif(), {
      wrapper: makeWrapper(queryClient)
    });
    const documents = [{ id: 10 }, { id: 11 }, { id: 12 }];

    await act(async () => {
      await result.current.mutateAsync({ massifId: '3663', documents });
    });

    documents.forEach(document => {
      expect(apiPut).toHaveBeenCalledWith(
        associateDocumentToMassifUrl('3663', document.id)
      );
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: documentKeys.detail(document.id)
      });
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: massifKeys.detail(3663)
    });
  });

  it('refreshes both sides after unlinking a massif document', async () => {
    apiDelete.mockResolvedValue(null);
    const { result } = renderHook(() => useUnlinkDocumentToMassif(), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      await result.current.mutateAsync({ massifId: '3663', documentId: 7 });
    });

    expect(apiDelete).toHaveBeenCalledWith(
      associateDocumentToMassifUrl('3663', 7)
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: massifKeys.detail(3663)
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: documentKeys.detail(7)
    });
  });
});
