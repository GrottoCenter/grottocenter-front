import { apiPut } from './client';

const associateAll = async (entities, urlFor) => {
  // Wait for every write before invalidating, including on partial failure,
  // so a refetch cannot observe an unfinished batch of associations.
  const results = await Promise.allSettled(
    entities.map(entity => apiPut(urlFor(entity)))
  );
  const rejections = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
  if (rejections.length > 0) {
    const error = rejections[0];
    error.rejections = rejections;
    throw error;
  }
  return results.map(result => result.value);
};

export default associateAll;
