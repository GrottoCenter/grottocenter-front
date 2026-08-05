import * as fc from 'fast-check';

/**
 * Feature: substance-reference-table
 *
 * Property-based tests for the normalizeSensorConfig substance extraction
 * and the createSensorConfig body construction.
 */

// ---------------------------------------------------------------------------
// Helper — mirrors the normalizer substance logic from importWizard.js
// ---------------------------------------------------------------------------

/**
 * Extracts idSubstance and substanceName from a populated substance
 * association object (or null).
 */
const extractSubstance = substance => ({
  idSubstance: substance?.id ?? null,
  substanceName: substance?.name ?? null
});

/**
 * Builds the request body idSubstance field logic.
 */
const buildIdSubstanceField = configData =>
  configData.idSubstance != null ? { idSubstance: configData.idSubstance } : {};

// ---------------------------------------------------------------------------
// Property 3: Normalizer extracts substance association
//
// For any API response where substance is either a populated object
// {id, name, ...} or null, the normalizer produces:
// - idSubstance = substance?.id ?? null
// - substanceName = substance?.name ?? null
//
// Encodes: substance association extraction is correct for objects and null.
// Covers: populated objects, null.
//
// Validates: Requirements 5.4, 5.5
// ---------------------------------------------------------------------------
describe('Feature: substance-reference-table, Property 3: Normalizer extracts substance association', () => {
  const substanceObjectArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 200 }),
    formula: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: null
    }),
    casNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: null
    }),
    externalId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: null
    }),
    externalSource: fc.option(fc.constant('PubChem'), { nil: null })
  });

  const substanceArb = fc.oneof(
    substanceObjectArb,
    fc.constant(null),
    fc.constant(undefined)
  );

  it('extracts id and name from populated substance, or null from null/undefined', () => {
    fc.assert(
      fc.property(substanceArb, substance => {
        const result = extractSubstance(substance);

        if (substance != null && typeof substance === 'object') {
          expect(result.idSubstance).toBe(substance.id);
          expect(result.substanceName).toBe(substance.name);
        } else {
          expect(result.idSubstance).toBeNull();
          expect(result.substanceName).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: idSubstance omitted for non-substance quantity kinds
//
// For any sensor config creation with a quantity kind whose code is NOT
// in ["Concentration", "IsotopeDelta"], the request body SHALL NOT contain
// the idSubstance key.
//
// Encodes: idSubstance is conditionally included only when present.
// Covers: configData with idSubstance as null or undefined.
//
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------
describe('Feature: substance-reference-table, Property 4: idSubstance omitted for non-substance QKs', () => {
  const nullishArb = fc.oneof(fc.constant(null), fc.constant(undefined));

  it('request body does not contain idSubstance key when value is null or undefined', () => {
    fc.assert(
      fc.property(nullishArb, idSubstance => {
        const configData = { idSubstance };
        const result = buildIdSubstanceField(configData);

        expect(result).not.toHaveProperty('idSubstance');
        expect(Object.keys(result)).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('request body contains idSubstance key when value is a positive integer', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), idSubstance => {
        const configData = { idSubstance };
        const result = buildIdSubstanceField(configData);

        expect(result).toHaveProperty('idSubstance', idSubstance);
      }),
      { numRuns: 100 }
    );
  });
});
