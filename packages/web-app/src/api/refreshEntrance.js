import { entranceKeys } from './queryKeys';

export const refreshEntrance = (queryClient, entrance) => {
  // Only seed full detail responses, never list or legacy update payloads.
  const hasDetail = Boolean(
    entrance?.id &&
    'featuredFile' in entrance &&
    Array.isArray(entrance.documents)
  );
  if (hasDetail)
    queryClient.setQueryData(entranceKeys.detail(entrance.id), entrance);
  // The updated detail is already fresh. Refetching it could race the PUT
  // response, and every popup/page uses this same normalized detail key.
  queryClient.invalidateQueries({
    queryKey: entranceKeys.all,
    predicate: query => !hasDetail || query.queryKey[2] !== String(entrance.id)
  });
};
