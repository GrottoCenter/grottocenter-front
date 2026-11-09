import { useQuery } from '@tanstack/react-query';
import { deletedEntitiesQueryOptions } from '@/api/deletedEntitiesQueryOptions';
import { STALE } from '@/conf/queryClient';

export const useDeletedEntities = ({
  enabled = true,
  staleTime = STALE.VOLATILE,
  ...options
}) => useQuery({ ...deletedEntitiesQueryOptions(options), enabled, staleTime });
