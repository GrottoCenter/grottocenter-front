import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import PropTypes from 'prop-types';

import { apiPut, apiDelete, apiPatch } from '@/api/client';
import { documentKeys, pointKeys } from '@/api/queryKeys';
import { pointDocumentUrl, pointUrl } from '@/conf/apiRoutes';
import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  useLinkDocumentsToPoint,
  useUnlinkDocumentFromPoint,
  useDeletePoint,
  useUpdatePoint
} from './usePoint';

vi.mock('@/api/client', () => ({
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn()
}));

let queryClient;
let invalidate;
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
Wrapper.propTypes = { children: PropTypes.node.isRequired };

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = createTestQueryClient();
  invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
});
afterEach(() => queryClient.clear());

it('waits for all document links before refreshing, including after a conflict', async () => {
  const conflict = Object.assign(new Error('Already attached'), {
    status: 409
  });
  let finishSecond;
  apiPut.mockRejectedValueOnce(conflict).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishSecond = resolve;
      })
  );
  const { result } = renderHook(() => useLinkDocumentsToPoint(), {
    wrapper: Wrapper
  });
  let mutation;
  await act(async () => {
    mutation = result.current
      .mutateAsync({ pointId: 5, documents: [{ id: 1 }, { id: 2 }] })
      .catch(error => error);
    await Promise.resolve();
  });
  expect(invalidate).not.toHaveBeenCalled();
  await act(async () => {
    finishSecond(null);
    expect(await mutation).toBe(conflict);
  });
  expect(apiPut).toHaveBeenCalledWith(pointDocumentUrl(5, 1));
  expect(apiPut).toHaveBeenCalledWith(pointDocumentUrl(5, 2));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: pointKeys.detail(5) });
  [1, 2].forEach(id =>
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: documentKeys.detail(id)
    })
  );
});

it('refreshes both sides after unlinking a document', async () => {
  apiDelete.mockResolvedValue(null);
  const { result } = renderHook(() => useUnlinkDocumentFromPoint(), {
    wrapper: Wrapper
  });
  await act(async () => {
    await result.current.mutateAsync({ pointId: 5, documentId: 2 });
  });
  expect(apiDelete).toHaveBeenCalledWith(pointDocumentUrl(5, 2));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: pointKeys.detail(5) });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: documentKeys.detail(2) });
});

it('soft-deletes without a permanent-delete option and refreshes the catalogue', async () => {
  apiDelete.mockResolvedValue({ id: 5, isDeleted: true });
  const { result } = renderHook(() => useDeletePoint(), { wrapper: Wrapper });
  await act(async () => {
    await result.current.mutateAsync({ id: 5 });
  });
  expect(apiDelete).toHaveBeenCalledWith(pointUrl(5));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: pointKeys.all });
});

it('uses a partial update and preserves omitted coordinates', async () => {
  apiPatch.mockResolvedValue({ id: 5 });
  const { result } = renderHook(() => useUpdatePoint(), { wrapper: Wrapper });
  await act(async () => {
    await result.current.mutateAsync({
      id: 5,
      label: 'New name',
      underground: true,
      caveId: 7
    });
  });
  expect(apiPatch).toHaveBeenCalledWith(pointUrl(5), {
    label: 'New name',
    underground: true,
    caveId: 7
  });
});
