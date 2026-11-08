import { useQuery } from '@tanstack/react-query';

import { entranceQueryOptions } from '@/api/entranceQueryOptions';

/** The full detail payload of an entrance. */
export const useEntrance = entranceId =>
  useQuery(entranceQueryOptions(entranceId));

export default useEntrance;
