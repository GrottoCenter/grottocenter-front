import fc from 'fast-check';

import entranceReducer from '../reducers/EntranceReducer';
import { MOVE_LOCATION_RELEVANCE_SUCCESS } from '../actions/Location/MoveRelevance';

// The undo logic in useMoveRelevanceWithUndo uses `direction * -1`
// to compute the opposite direction. This property test validates
// that mathematical invariant without needing to render React components.
const undoDirection = direction => direction * -1;

// Generator: direction is always one of {1, -1}
const directionArb = fc.constantFrom(1, -1);

/**
 * Property 5: Undo direction inversion
 * Validates: Requirements 9.2, 9.3
 */
describe('Property 5: Undo direction inversion', () => {
  it('undo direction is the negation of the original direction', () => {
    fc.assert(
      fc.property(directionArb, direction => {
        expect(undoDirection(direction)).toBe(-direction);
      }),
      { numRuns: 100 }
    );
  });

  it('undo of undo restores the original direction (involution)', () => {
    fc.assert(
      fc.property(directionArb, direction => {
        expect(undoDirection(undoDirection(direction))).toBe(direction);
      }),
      { numRuns: 100 }
    );
  });

  it('undo direction is always in the valid set {1, -1}', () => {
    fc.assert(
      fc.property(directionArb, direction => {
        const result = undoDirection(direction);
        expect(result === 1 || result === -1).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Move-then-undo round trip
 * Validates: Requirements 9.4
 *
 * For any entity list and any entity within it, performing a move-relevance
 * in direction D followed by an undo (move in direction -D) should restore
 * the original relevance values of both affected entities.
 */

// Generator: entity with a given id
const entityArb = id =>
  fc.record({
    id: fc.constant(id),
    relevance: fc.integer({ min: 0, max: 1000 }),
    title: fc.string({ minLength: 1, maxLength: 20 })
  });

// Generator: list of entities (min 2) with two adjacent entities picked for swapping
const roundTripArb = fc
  .integer({ min: 2, max: 20 })
  .chain(size => {
    const ids = Array.from({ length: size }, (_, i) => i + 1);
    return fc.tuple(
      fc.tuple(...ids.map(id => entityArb(id))),
      // Pick an index so that index and index+1 are both valid
      fc.integer({ min: 0, max: size - 2 })
    );
  })
  .map(([entities, idx]) => {
    const list = [...entities];
    const entityA = list[idx];
    const entityB = list[idx + 1];
    return { list, entityA, entityB };
  });

describe('Property 6: Move-then-undo round trip', () => {
  it('applying a move then undoing it restores the original entity list', () => {
    fc.assert(
      fc.property(roundTripArb, ({ list, entityA, entityB }) => {
        // Initial reducer state
        const initialState = {
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

        // Step 1: Move — swap relevance values of entityA and entityB
        const moveAction = {
          type: MOVE_LOCATION_RELEVANCE_SUCCESS,
          moved: { ...entityA, relevance: entityB.relevance },
          swapped: { ...entityB, relevance: entityA.relevance }
        };
        const stateAfterMove = entranceReducer(initialState, moveAction);

        // Step 2: Undo — swap them back
        const undoAction = {
          type: MOVE_LOCATION_RELEVANCE_SUCCESS,
          moved: { ...entityA, relevance: entityA.relevance },
          swapped: { ...entityB, relevance: entityB.relevance }
        };
        const stateAfterUndo = entranceReducer(stateAfterMove, undoAction);

        // Verify: every entity's relevance matches the original
        const finalLocations = stateAfterUndo.data.locations;
        expect(finalLocations).toHaveLength(list.length);

        for (const original of list) {
          const restored = finalLocations.find(e => e.id === original.id);
          expect(restored.relevance).toBe(original.relevance);
          expect(restored.title).toBe(original.title);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('intermediate state after move has swapped relevance values', () => {
    fc.assert(
      fc.property(roundTripArb, ({ list, entityA, entityB }) => {
        const initialState = {
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

        // Move: swap relevance
        const moveAction = {
          type: MOVE_LOCATION_RELEVANCE_SUCCESS,
          moved: { ...entityA, relevance: entityB.relevance },
          swapped: { ...entityB, relevance: entityA.relevance }
        };
        const stateAfterMove = entranceReducer(initialState, moveAction);
        const movedLocations = stateAfterMove.data.locations;

        // After move, entityA should have entityB's original relevance
        const movedA = movedLocations.find(e => e.id === entityA.id);
        expect(movedA.relevance).toBe(entityB.relevance);

        // After move, entityB should have entityA's original relevance
        const movedB = movedLocations.find(e => e.id === entityB.id);
        expect(movedB.relevance).toBe(entityA.relevance);

        // All other entities unchanged
        for (const original of list) {
          if (original.id === entityA.id || original.id === entityB.id)
            continue;
          const found = movedLocations.find(e => e.id === original.id);
          expect(found).toEqual(original);
        }
      }),
      { numRuns: 100 }
    );
  });
});
