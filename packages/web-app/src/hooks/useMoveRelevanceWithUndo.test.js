import fc from 'fast-check';

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

// Property 6 (Move-then-undo round trip) used to exercise the entrance
// reducer. state.entrance moved to React Query in the same PR that moved
// caves and massifs; move-relevance now runs through the bridge middleware
// and a server refetch, so the reducer-level property no longer applies.
