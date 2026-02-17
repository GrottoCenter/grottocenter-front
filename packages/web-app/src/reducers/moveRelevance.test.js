import fc from 'fast-check';
import entranceReducer from './EntranceReducer';
import caveReducer from './CaveReducer';
import massifReducer from './MassifReducer';
import { MOVE_LOCATION_RELEVANCE_SUCCESS } from '../actions/Location/MoveRelevance';
import { MOVE_DESCRIPTION_RELEVANCE_SUCCESS } from '../actions/Description/MoveRelevance';

/**
 * Feature: relevance-ordering, Property 3: Reducer swap correctness
 * Validates: Requirements 3.3, 7.1, 7.2, 7.3
 *
 * For any reducer state containing an entity list, and any move-relevance
 * success action with `moved` and `swapped` payloads, the resulting state
 * should contain both updated entities with their new relevance values,
 * and all other entities in the list should remain unchanged.
 */

// Generator: entity with unique id and a relevance value
const entityArb = (id) =>
  fc.record({
    id: fc.constant(id),
    relevance: fc.integer({ min: 0, max: 1000 }),
    title: fc.string({ minLength: 1, maxLength: 20 })
  });

// Generator: array of entities with unique ids (min 2 so we can pick a pair)
const entityListArb = fc
  .integer({ min: 2, max: 20 })
  .chain((size) => {
    const ids = Array.from({ length: size }, (_, i) => i + 1);
    return fc.tuple(
      fc.tuple(...ids.map((id) => entityArb(id))),
      fc.integer({ min: 0, max: size - 1 }),
      fc.integer({ min: 0, max: size - 1 }),
      fc.integer({ min: 0, max: 1000 }),
      fc.integer({ min: 0, max: 1000 })
    );
  })
  .filter(
    ([entities, movedIdx, swappedIdx]) => movedIdx !== swappedIdx
  )
  .map(([entities, movedIdx, swappedIdx, newMovedRel, newSwappedRel]) => {
    const list = [...entities];
    const moved = { ...list[movedIdx], relevance: newMovedRel };
    const swapped = { ...list[swappedIdx], relevance: newSwappedRel };
    return { list, moved, swapped, movedIdx, swappedIdx };
  });

describe('Property 3: Reducer swap correctness', () => {
  describe('EntranceReducer — MOVE_LOCATION_RELEVANCE_SUCCESS', () => {
    it('updates moved and swapped entities, leaves others unchanged', () => {
      fc.assert(
        fc.property(entityListArb, ({ list, moved, swapped }) => {
          const state = {
            data: {
              locations: list,
              descriptions: [],
              comments: [],
              riggings: [],
              histories: []
            },
            loading: false,
            error: null,
            latestHttpCode: null
          };

          const action = {
            type: MOVE_LOCATION_RELEVANCE_SUCCESS,
            moved,
            swapped
          };

          const result = entranceReducer(state, action);
          const resultLocations = result.data.locations;

          // Array length preserved
          expect(resultLocations).toHaveLength(list.length);

          // Moved entity has new relevance
          const resultMoved = resultLocations.find(
            (e) => e.id === moved.id
          );
          expect(resultMoved.relevance).toBe(moved.relevance);
          // Non-relevance fields preserved
          expect(resultMoved.title).toBe(list.find(e => e.id === moved.id).title);

          // Swapped entity has new relevance
          const resultSwapped = resultLocations.find(
            (e) => e.id === swapped.id
          );
          expect(resultSwapped.relevance).toBe(swapped.relevance);
          // Non-relevance fields preserved
          expect(resultSwapped.title).toBe(list.find(e => e.id === swapped.id).title);

          // All other entities unchanged
          for (const original of list) {
            if (original.id === moved.id || original.id === swapped.id)
              continue;
            const found = resultLocations.find(
              (e) => e.id === original.id
            );
            expect(found).toEqual(original);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('CaveReducer — MOVE_DESCRIPTION_RELEVANCE_SUCCESS', () => {
    it('updates moved and swapped descriptions, leaves others unchanged', () => {
      fc.assert(
        fc.property(entityListArb, ({ list, moved, swapped }) => {
          const state = {
            cave: { descriptions: list },
            loading: false,
            error: null
          };

          const action = {
            type: MOVE_DESCRIPTION_RELEVANCE_SUCCESS,
            moved,
            swapped
          };

          const result = caveReducer(state, action);
          const resultDescs = result.cave.descriptions;

          expect(resultDescs).toHaveLength(list.length);

          const resultMoved = resultDescs.find(
            (e) => e.id === moved.id
          );
          expect(resultMoved.relevance).toBe(moved.relevance);

          const resultSwapped = resultDescs.find(
            (e) => e.id === swapped.id
          );
          expect(resultSwapped.relevance).toBe(swapped.relevance);

          for (const original of list) {
            if (original.id === moved.id || original.id === swapped.id)
              continue;
            const found = resultDescs.find((e) => e.id === original.id);
            expect(found).toEqual(original);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('MassifReducer — MOVE_DESCRIPTION_RELEVANCE_SUCCESS', () => {
    it('updates moved and swapped descriptions, leaves others unchanged', () => {
      fc.assert(
        fc.property(entityListArb, ({ list, moved, swapped }) => {
          const state = {
            massif: { descriptions: list },
            isFetching: false,
            error: null
          };

          const action = {
            type: MOVE_DESCRIPTION_RELEVANCE_SUCCESS,
            moved,
            swapped
          };

          const result = massifReducer(state, action);
          const resultDescs = result.massif.descriptions;

          expect(resultDescs).toHaveLength(list.length);

          const resultMoved = resultDescs.find(
            (e) => e.id === moved.id
          );
          expect(resultMoved.relevance).toBe(moved.relevance);

          const resultSwapped = resultDescs.find(
            (e) => e.id === swapped.id
          );
          expect(resultSwapped.relevance).toBe(swapped.relevance);

          for (const original of list) {
            if (original.id === moved.id || original.id === swapped.id)
              continue;
            const found = resultDescs.find((e) => e.id === original.id);
            expect(found).toEqual(original);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
