/**
 * Swap relevance values for two entities in a list.
 * Used by all reducers that handle MOVE_*_RELEVANCE_SUCCESS actions.
 *
 * @param {Array} list - Entity array from state
 * @param {Object} moved - { id, relevance } of the moved entity
 * @param {Object} swapped - { id, relevance } of the swapped entity
 * @returns {Array} New array with updated relevance values
 */
const swapRelevance = (list, moved, swapped) =>
  list.map(e => {
    if (e.id === moved.id) return { ...e, relevance: moved.relevance };
    if (e.id === swapped.id) return { ...e, relevance: swapped.relevance };
    return e;
  });

export default swapRelevance;
