import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { organizationKeys, documentKeys } from '@/api/queryKeys';
import {
  completeEntityDeletion,
  completeEntityRestoration
} from './entityDeletionCache';

describe('entity deletion cache lifecycle', () => {
  let client;
  const sourceKey = organizationKeys.detail(42);
  const source = { id: 42, name: 'Old club', isDeleted: false, redirectTo: 99 };

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } }
    });
    client.setQueryData(sourceKey, source);
  });

  afterEach(() => client.clear());

  it('applies confirmed soft deletion and invalidates merge targets and related lists without refetching the source', async () => {
    const fetchSource = vi.fn();
    const observer = new QueryObserver(client, {
      queryKey: sourceKey,
      queryFn: fetchSource
    });
    const unsubscribe = observer.subscribe(() => {});
    const targetKey = organizationKeys.detail(43);
    const relatedKey = documentKeys.detail(7);
    client.setQueryData(targetKey, { id: 43 });
    client.setQueryData(relatedKey, { id: 7 });
    await completeEntityDeletion(
      client,
      organizationKeys,
      {},
      { id: 42, entityId: 43, isPermanent: false }
    );
    expect(client.getQueryData(sourceKey)).toEqual({
      ...source,
      isDeleted: true,
      redirectTo: 43
    });
    expect(fetchSource).not.toHaveBeenCalled();
    expect(client.getQueryState(targetKey).isInvalidated).toBe(true);
    expect(client.getQueryState(relatedKey).isInvalidated).toBe(true);
    unsubscribe();
  });

  it('retains the mounted hard-deleted source until unmount, then removes it and inactive variants', async () => {
    const fetchSource = vi.fn();
    const observer = new QueryObserver(client, {
      queryKey: sourceKey,
      queryFn: fetchSource
    });
    const unsubscribe = observer.subscribe(() => {});
    const variantKey = [...sourceKey, { preview: true }];
    client.setQueryData(variantKey, source);
    await completeEntityDeletion(client, organizationKeys, null, {
      id: 42,
      isPermanent: true
    });
    expect(client.getQueryData(sourceKey)).toEqual(source);
    expect(client.getQueryData(variantKey)).toBeUndefined();
    expect(fetchSource).not.toHaveBeenCalled();
    unsubscribe();
    expect(client.getQueryData(sourceKey)).toBeUndefined();
  });

  it('clears an old redirect when no replacement was selected and does not manufacture unloaded details', async () => {
    await completeEntityDeletion(client, organizationKeys, null, {
      id: 42,
      isPermanent: false
    });
    expect(client.getQueryData(sourceKey).redirectTo).toBeNull();
    await completeEntityDeletion(client, organizationKeys, null, {
      id: 99,
      isPermanent: false
    });
    expect(client.getQueryData(organizationKeys.detail(99))).toBeUndefined();
  });

  it('restores the cached source and clears its redirect even if the background refresh fails', async () => {
    client.setQueryData(sourceKey, { ...source, isDeleted: true });
    const fetchSource = vi
      .fn()
      .mockRejectedValue(new Error('Refresh unavailable'));
    const observer = new QueryObserver(client, {
      queryKey: sourceKey,
      queryFn: fetchSource
    });
    const unsubscribe = observer.subscribe(() => {});
    await completeEntityRestoration(client, organizationKeys, null, { id: 42 });
    expect(client.getQueryData(sourceKey)).toEqual({
      ...source,
      redirectTo: null
    });
    expect(fetchSource).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
