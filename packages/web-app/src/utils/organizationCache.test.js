import { createTestQueryClient } from '@/test/renderWithProviders';
import {
  invalidateOrganizationCaches,
  subscribeOrganizationMapChanges
} from './organizationCache';
import { invalidateAll } from './mapTileCache';

vi.mock('./mapTileCache', async importOriginal => ({
  ...(await importOriginal()),
  invalidateAll: vi.fn()
}));

it('invalidates embedded references and refreshes map subscribers, without clearing unrelated session data', () => {
  const client = createTestQueryClient();
  const orgKey = ['organization', 'detail', '42'];
  const documentKey = ['document', 'detail', '7'];
  const searchKey = ['advancedSearch', 'results', { entity: 'organizations' }];
  const quickKey = [
    'quicksearch',
    'results',
    { entities: ['documents', 'entrances'] }
  ];
  const accountKey = ['account', 'current'];
  [orgKey, documentKey, searchKey, quickKey, accountKey].forEach(key =>
    client.setQueryData(key, {})
  );
  const listener = vi.fn();
  const unsubscribe = subscribeOrganizationMapChanges(listener);
  invalidateOrganizationCaches(client);
  [orgKey, documentKey, searchKey, quickKey].forEach(key =>
    expect(client.getQueryState(key).isInvalidated).toBe(true)
  );
  expect(client.getQueryState(accountKey).isInvalidated).toBe(false);
  expect(invalidateAll).toHaveBeenCalledWith('organizations', {
    discardData: true
  });
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  invalidateOrganizationCaches(client);
  expect(listener).toHaveBeenCalledTimes(1);
});
