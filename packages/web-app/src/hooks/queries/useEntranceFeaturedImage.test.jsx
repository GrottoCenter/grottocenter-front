import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { apiGet, apiPut, apiPutForm, apiDelete } from '@/api/client';
import { entranceKeys } from '@/api/queryKeys';
import { getEntranceUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useUpdateEntrance } from '@/hooks/mutations/useEntranceForm';
import { useUpdateDocument } from '@/hooks/mutations/useDocumentForm';
import { useUnlinkDocumentToEntrance } from '@/hooks/mutations/useLinkDocumentToEntrance';
import { useProcessDocuments } from '@/hooks/mutations/useProcessDocuments';
import { useDeleteDocument } from '@/hooks/mutations/useDeleteDocument';
import { useEntrance } from './useEntrance';
import { useEntranceFeaturedImage } from './useEntranceFeaturedImage';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPutForm: vi.fn(),
  apiDelete: vi.fn()
}));
vi.mock('@/utils/mapTileCache', () => ({
  invalidateAll: vi.fn(),
  invalidateTileAt: vi.fn()
}));

const image = {
  id: 1,
  name: 'Entrance',
  isDeleted: false,
  redirectTo: null,
  featuredFile: { id: 10, completePath: '/photo.jpg' }
};
const detail = { ...image, documents: [], cave: { id: 2 } };
let queryClient;
let wrapper;

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = createTestQueryClient();
  wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  apiGet.mockResolvedValue(image);
});
afterEach(() => queryClient.clear());

it('fetches complete detail when opening the page after a lightweight read', async () => {
  const popup = renderHook(() => useEntranceFeaturedImage(1), { wrapper });
  await waitFor(() => expect(popup.result.current.isSuccess).toBe(true));
  expect(apiGet).toHaveBeenCalledWith(`${getEntranceUrl}1/featured-image`);
  expect(queryClient.getQueryData(entranceKeys.detail(1))).toBeUndefined();
  popup.unmount();
  apiGet.mockResolvedValue(detail);
  const page = renderHook(() => useEntrance('1'), { wrapper });
  await waitFor(() => expect(page.result.current.data).toEqual(detail));
  expect(apiGet).toHaveBeenLastCalledWith(`${getEntranceUrl}1`);
  expect(apiGet).toHaveBeenCalledTimes(2);
});

it.each([image.featuredFile, null])(
  'reuses fresh full detail with its original freshness and photo %s',
  async featuredFile => {
    const dataUpdatedAt = Date.now() - STALE.STANDARD / 2;
    queryClient.setQueryData(
      entranceKeys.detail('1'),
      { ...detail, featuredFile },
      { updatedAt: dataUpdatedAt }
    );
    const { result } = renderHook(() => useEntranceFeaturedImage(1), {
      wrapper
    });
    expect(result.current.data).toEqual({ ...image, featuredFile });
    expect(result.current.isPlaceholderData).toBe(true);
    expect(
      queryClient.getQueryData(entranceKeys.featuredImage(1))
    ).toBeUndefined();
    expect(
      queryClient.getQueryState(entranceKeys.detail(1)).dataUpdatedAt
    ).toBe(dataUpdatedAt);
    expect(apiGet).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(entranceKeys.detail(1)).cave).toEqual({
      id: 2
    });
  }
);

it('prefers fresh detail over an older lightweight cache without renewing either cache', () => {
  const updatedAt = Date.now() - STALE.STANDARD - 1;
  queryClient.setQueryData(entranceKeys.featuredImage(1), image, { updatedAt });
  queryClient.setQueryData(entranceKeys.detail(1), {
    ...detail,
    featuredFile: null
  });
  const { result } = renderHook(() => useEntranceFeaturedImage(1), { wrapper });
  expect(result.current.data.featuredFile).toBeNull();
  expect(apiGet).not.toHaveBeenCalled();
  expect(
    queryClient.getQueryState(entranceKeys.featuredImage(1)).dataUpdatedAt
  ).toBe(updatedAt);
});

it('starts a lightweight read when borrowed detail is invalidated while the popup is open', async () => {
  queryClient.setQueryData(entranceKeys.detail(1), detail);
  const { result } = renderHook(() => useEntranceFeaturedImage(1), { wrapper });
  expect(result.current.data).toEqual(image);
  expect(apiGet).not.toHaveBeenCalled();
  apiGet.mockResolvedValue({ ...image, featuredFile: null });
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: entranceKeys.detail(1) });
  });
  await waitFor(() => expect(result.current.data.featuredFile).toBeNull());
  expect(apiGet).toHaveBeenCalledExactlyOnceWith(
    `${getEntranceUrl}1/featured-image`
  );
});

it.each(['expired', 'invalidated', 'missing featuredFile'])(
  'fetches the lightweight endpoint when detail is %s',
  async mode => {
    const data = { ...detail };
    if (mode === 'missing featuredFile') delete data.featuredFile;
    queryClient.setQueryData(entranceKeys.detail(1), data, {
      updatedAt:
        mode === 'expired' ? Date.now() - STALE.STANDARD - 1 : Date.now()
    });
    if (mode === 'invalidated')
      await queryClient.invalidateQueries({ queryKey: entranceKeys.detail(1) });
    const { result } = renderHook(() => useEntranceFeaturedImage(1), {
      wrapper
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiGet).toHaveBeenCalledExactlyOnceWith(
      `${getEntranceUrl}1/featured-image`
    );
    expect(queryClient.getQueryData(entranceKeys.detail(1))).toEqual(data);
  }
);

it('reuses a fresh lightweight cache with a normalized id and refetches when stale', async () => {
  queryClient.setQueryData(entranceKeys.featuredImage('1'), image);
  const popup = renderHook(() => useEntranceFeaturedImage(1), { wrapper });
  expect(popup.result.current.data).toEqual(image);
  expect(apiGet).not.toHaveBeenCalled();
  popup.unmount();
  queryClient.setQueryData(entranceKeys.featuredImage(1), image, {
    updatedAt: Date.now() - STALE.STANDARD - 1
  });
  const reopened = renderHook(() => useEntranceFeaturedImage('1'), { wrapper });
  await waitFor(() => expect(reopened.result.current.isFetching).toBe(false));
  expect(apiGet).toHaveBeenCalledExactlyOnceWith(
    `${getEntranceUrl}1/featured-image`
  );
});

it.each([undefined, null])('does not fetch without an active id (%s)', id => {
  renderHook(() => useEntranceFeaturedImage(id), { wrapper });
  expect(apiGet).not.toHaveBeenCalled();
});

it('invalidates a cached image after saving a new featured file without refetching detail', async () => {
  queryClient.setQueryData(entranceKeys.detail(1), detail);
  queryClient.setQueryData(entranceKeys.featuredImage(1), image);
  const updated = { ...detail, featuredFile: null };
  apiPut.mockResolvedValue(updated);
  const { result } = renderHook(
    () => ({ image: useEntranceFeaturedImage(1), update: useUpdateEntrance() }),
    { wrapper }
  );
  await act(async () => {
    await result.current.update.mutateAsync({ id: 1, featuredFile: null });
  });
  await waitFor(() =>
    expect(result.current.image.data.featuredFile).toBeNull()
  );
  expect(queryClient.getQueryData(entranceKeys.detail(1))).toEqual(updated);
  expect(apiGet).not.toHaveBeenCalled();
});

it.each(['unlink', 'file edit', 'refuse document', 'delete document'])(
  'refreshes both cached reads after an eligibility change: %s',
  async change => {
    queryClient.setQueryData(entranceKeys.detail(1), detail);
    queryClient.setQueryData(entranceKeys.featuredImage(1), image);
    apiGet.mockResolvedValue({ ...image, featuredFile: null });
    apiPut.mockResolvedValue([]);
    apiPutForm.mockResolvedValue({ id: 3 });
    apiDelete.mockResolvedValue(null);
    const { result } = renderHook(
      () => ({
        image: useEntranceFeaturedImage(1),
        unlink: useUnlinkDocumentToEntrance(),
        edit: useUpdateDocument(),
        process: useProcessDocuments(),
        delete: useDeleteDocument()
      }),
      { wrapper }
    );
    await act(async () => {
      if (change === 'unlink')
        await result.current.unlink.mutateAsync({
          entranceId: 1,
          documentId: 3
        });
      if (change === 'file edit')
        await result.current.edit.mutateAsync({ id: 3, files: [] });
      if (change === 'refuse document')
        await result.current.process.mutateAsync({
          ids: [3],
          isValidated: false
        });
      if (change === 'delete document')
        await result.current.delete.mutateAsync({ id: 3, isPermanent: false });
    });
    await waitFor(() =>
      expect(result.current.image.data.featuredFile).toBeNull()
    );
    expect(
      queryClient.getQueryState(entranceKeys.detail(1)).isInvalidated
    ).toBe(true);
    expect(apiGet).toHaveBeenCalledExactlyOnceWith(
      `${getEntranceUrl}1/featured-image`
    );
  }
);
