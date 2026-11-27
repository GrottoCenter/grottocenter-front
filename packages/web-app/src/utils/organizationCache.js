import {
  advancedSearchKeys,
  countryKeys,
  documentKeys,
  entranceKeys,
  caveKeys,
  massifKeys,
  organizationKeys,
  personKeys,
  quicksearchKeys,
  regionKeys
} from '@/api/queryKeys';
import { invalidateAll } from './mapTileCache';

const mapListeners = new Set();

export const subscribeOrganizationMapChanges = listener => {
  mapListeners.add(listener);
  return () => mapListeners.delete(listener);
};

export const invalidateOrganizationCaches = (queryClient, excludedKey) => {
  [
    organizationKeys,
    documentKeys,
    entranceKeys,
    caveKeys,
    personKeys,
    countryKeys,
    regionKeys,
    massifKeys
  ].forEach(keys =>
    queryClient.invalidateQueries({
      queryKey: keys.all,
      predicate: query =>
        !excludedKey ||
        !excludedKey.every((part, index) => query.queryKey[index] === part)
    })
  );
  queryClient.invalidateQueries({
    predicate: query => {
      const [domain, , params] = query.queryKey;
      if (
        domain !== advancedSearchKeys.all[0] &&
        domain !== quicksearchKeys.all[0]
      )
        return false;
      const entities = params?.entities ?? [params?.entity];
      return entities.some(entity =>
        ['organizations', 'documents'].includes(entity)
      );
    }
  });
  invalidateAll('organizations', { discardData: true });
  mapListeners.forEach(listener => listener());
};
