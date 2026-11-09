import { apiGetWithRange } from '@/api/client';
import { getTotalCount, makeUrl } from '@/actions/utils';
import { STALE } from '@/conf/queryClient';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';

const selectors = Object.fromEntries(
  Object.keys(DELETED_ENTITY_RESOURCES).map(resource => [
    resource,
    ({ data, contentRange }) => {
      const entities = data?.[resource];
      // Refuse malformed pages instead of presenting active content as deleted.
      if (
        !Array.isArray(entities) ||
        entities.some(entity => entity?.isDeleted !== true) ||
        (entities.length > 0 && !/\/\d+$/.test(contentRange ?? ''))
      ) {
        throw Object.assign(new Error('Invalid deleted entities response'), {
          code: 'deletedEntities.listUnavailable'
        });
      }
      return {
        entities,
        totalCount: getTotalCount(entities.length, contentRange)
      };
    }
  ])
);

export const deletedEntitiesQueryOptions = ({
  entityType,
  skip = 0,
  limit = 50
}) => {
  const resource = DELETED_ENTITY_RESOURCES[entityType];
  const criteria = { isDeleted: true, skip, limit };
  return {
    queryKey: resource.keys.list(criteria),
    queryFn: ({ signal }) =>
      apiGetWithRange(makeUrl(resource.collectionUrl, criteria), { signal }),
    select: selectors[entityType],
    retry: false,
    staleTime: STALE.VOLATILE
  };
};
