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
  // response. Invalidate its lightweight image as well as other entrance reads.
  queryClient.invalidateQueries({
    queryKey: entranceKeys.all,
    predicate: query =>
      !hasDetail ||
      query.queryKey.length !== 3 ||
      query.queryKey[1] !== 'detail' ||
      query.queryKey[2] !== String(entrance.id)
  });
};
