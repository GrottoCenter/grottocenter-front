import fc from 'fast-check';
import { sortByRelevance } from './sortByRelevance';

// Generate entities with optional relevance
const entityArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  relevance: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined })
});

const entitiesArb = fc.array(entityArb, { minLength: 0, maxLength: 50 });

/**
 * Property 1: Relevance sort invariant
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe('Property 1: Relevance sort invariant', () => {
  it('entities with defined relevance appear before those without', () => {
    fc.assert(
      fc.property(entitiesArb, (entities) => {
        const sorted = sortByRelevance(entities);
        const firstUndefinedIdx = sorted.findIndex(
          (e) => e.relevance === undefined
        );
        if (firstUndefinedIdx === -1) return true;
        // Every item after the first undefined must also be undefined
        return sorted.slice(firstUndefinedIdx).every(
          (e) => e.relevance === undefined
        );
      }),
      { numRuns: 100 }
    );
  });

  it('entities with defined relevance are in ascending order', () => {
    fc.assert(
      fc.property(entitiesArb, (entities) => {
        const sorted = sortByRelevance(entities);
        const withRelevance = sorted.filter(
          (e) => e.relevance !== undefined
        );
        for (let i = 1; i < withRelevance.length; i++) {
          if (withRelevance[i].relevance < withRelevance[i - 1].relevance) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('entities with equal relevance preserve original relative order (stable)', () => {
    fc.assert(
      fc.property(entitiesArb, (entities) => {
        // Tag each entity with its original index for tracking
        const tagged = entities.map((e, i) => ({ ...e, _origIdx: i }));
        const sorted = sortByRelevance(tagged);

        // Group by relevance value (including undefined)
        const groups = new Map();
        for (const item of sorted) {
          const key = item.relevance === undefined ? '__undef__' : item.relevance;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(item);
        }

        // Within each group, original indices must be in ascending order
        for (const group of groups.values()) {
          for (let i = 1; i < group.length; i++) {
            if (group[i]._origIdx < group[i - 1]._origIdx) {
              return false;
            }
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
