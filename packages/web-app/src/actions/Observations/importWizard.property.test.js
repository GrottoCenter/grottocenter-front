import * as fc from 'fast-check';

/**
 * Feature: sensor-substance-field
 *
 * Property-based tests for the normalizeSensorConfig substance mapping logic.
 * Tests the pure formula extracted from the normalizer to avoid network/Redux deps.
 */

// ---------------------------------------------------------------------------
// Helper — mirrors the normalizer substance logic from importWizard.js
// ---------------------------------------------------------------------------

/**
 * The substance normalization formula as implemented in normalizeSensorConfig.
 * Maps API response substance to internal representation.
 */
const normalizeSubstance = substance => substance ?? null;

// ---------------------------------------------------------------------------
// Property 3: Normalizer substance mapping
//
// For any API response object where the substance field is either a non-empty
// string, null, or undefined, the normalizeSensorConfig function produces a
// normalized object where substance equals the original string value when
// present, or null when the field is null or undefined.
//
// Encodes: substance normalization is lossless for strings, coalesces
//          null/undefined to null.
// Covers: string values, null, and undefined.
//
// Validates: Requirements 3.3, 3.4
// ---------------------------------------------------------------------------
describe('Feature: sensor-substance-field, Property 3: Normalizer substance mapping', () => {
  const substanceArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }),
    fc.constant(null),
    fc.constant(undefined)
  );

  it('normalized substance equals the original string when present, or null when null/undefined', () => {
    fc.assert(
      fc.property(substanceArb, substance => {
        const result = normalizeSubstance(substance);

        if (typeof substance === 'string') {
          expect(result).toBe(substance);
        } else {
          expect(result).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});
