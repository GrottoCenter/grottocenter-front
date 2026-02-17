/**
 * Sorts an array of entities by relevance in ascending order.
 * Entities with null/undefined relevance are placed at the end.
 * Uses stable sort to preserve API order for equal values.
 *
 * @param {Array} items - Array of entities with optional `relevance` field
 * @returns {Array} A new sorted array (does not mutate the input)
 */
export const sortByRelevance = (items) =>
  [...items].sort((a, b) => {
    const ra = a.relevance ?? Number.MAX_SAFE_INTEGER;
    const rb = b.relevance ?? Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });

export default sortByRelevance;
