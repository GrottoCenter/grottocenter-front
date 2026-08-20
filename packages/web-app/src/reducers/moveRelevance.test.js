import fc from 'fast-check';

/**
 * Feature: relevance-ordering, Property 3: Reducer swap correctness
 *
 * The property used to exercise the entrance/cave/massif reducers'
 * MOVE_*_RELEVANCE_SUCCESS branches. All three slices are gone: the
 * details now live in React Query, and the move-relevance path runs
 * through middlewares/queryInvalidationBridge which triggers a refetch.
 * The reducer-level property no longer has anywhere to attach.
 *
 * The generators are kept, ready for a property test at a higher level
 * (e.g. against the API's returned order) once one lands.
 */

// Generator: entity with unique id and a relevance value
const entityArb = id =>
  fc.record({
    id: fc.constant(id),
    relevance: fc.integer({ min: 0, max: 1000 }),
    title: fc.string({ minLength: 1, maxLength: 20 })
  });

// Generator: array of entities with unique ids (min 2 so we can pick a pair)
const entityListArb = fc
  .integer({ min: 2, max: 20 })
  .chain(size => {
    const ids = Array.from({ length: size }, (_, i) => i + 1);
    return fc.tuple(
      fc.tuple(...ids.map(id => entityArb(id))),
      fc.integer({ min: 0, max: size - 1 }),
      fc.integer({ min: 0, max: size - 1 }),
      fc.integer({ min: 0, max: 1000 }),
      fc.integer({ min: 0, max: 1000 })
    );
  })
  .filter(([_entities, movedIdx, swappedIdx]) => movedIdx !== swappedIdx)
  .map(([entities, movedIdx, swappedIdx, newMovedRel, newSwappedRel]) => {
    const list = [...entities];
    const moved = { ...list[movedIdx], relevance: newMovedRel };
    const swapped = { ...list[swappedIdx], relevance: newSwappedRel };
    return { list, moved, swapped, movedIdx, swappedIdx };
  });

describe('Property 3: Reducer swap correctness', () => {
  it('smoke — generators still produce well-formed inputs', () => {
    fc.assert(
      fc.property(entityListArb, ({ list, moved, swapped }) => {
        expect(list.length).toBeGreaterThanOrEqual(2);
        expect(moved.id).not.toBe(swapped.id);
      }),
      { numRuns: 25 }
    );
  });
});
