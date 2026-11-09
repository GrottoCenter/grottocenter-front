import { useQueries } from '@tanstack/react-query';
import { deletedEntitiesQueryOptions } from '@/api/deletedEntitiesQueryOptions';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';

export const useDeletedEntityCounts = ({ enabled = true } = {}) =>
  useQueries({
    queries: Object.keys(DELETED_ENTITY_RESOURCES).map(entityType => ({
      ...deletedEntitiesQueryOptions({ entityType, limit: 1 }),
      enabled
    }))
  });
