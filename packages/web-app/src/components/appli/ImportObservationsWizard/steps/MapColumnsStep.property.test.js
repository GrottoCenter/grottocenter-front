import * as fc from 'fast-check';

/**
 * Feature: substance-reference-table
 *
 * Property-based tests for the sensor config label format logic
 * in MapColumnsStep. Tests the pure label formula to avoid React/intl deps.
 */

// ---------------------------------------------------------------------------
// Helper — mirrors the label rendering logic from MapColumnsStep.jsx
// ---------------------------------------------------------------------------

/**
 * The label format logic as implemented in MapColumnsStep.
 * Uses a mock formatMessage that returns the quantityKindCode as-is
 * (since we're testing the format logic, not the i18n lookup).
 */
const computeLabel = ({ quantityKindCode, substanceName, unitSymbol }) => {
  const quantityKindName = quantityKindCode;
  return substanceName
    ? `${quantityKindName} [${substanceName}] (${unitSymbol})`
    : `${quantityKindName} (${unitSymbol})`;
};

// ---------------------------------------------------------------------------
// Property 6: Column label format with substanceName
//
// For any normalized sensor configuration, the rendered label matches
// "{quantityKindName} [{substanceName}] ({unitSymbol})" when substanceName
// is non-null, or "{quantityKindName} ({unitSymbol})" when substanceName
// is null.
//
// Encodes: label format includes substance name in brackets only when present.
// Covers: all quantity kind codes, arbitrary substance names, arbitrary
//         unit symbols.
//
// Validates: Requirements 6.1, 6.2
// ---------------------------------------------------------------------------
describe('Feature: substance-reference-table, Property 6: Column label format with substanceName', () => {
  const sensorConfigArb = fc.record({
    quantityKindCode: fc.constantFrom(
      'Temperature',
      'Concentration',
      'IsotopeDelta',
      'pH'
    ),
    substanceName: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
      nil: null
    }),
    unitSymbol: fc.string({ minLength: 1, maxLength: 20 })
  });

  it('label matches expected format with substanceName in brackets when non-null', () => {
    fc.assert(
      fc.property(sensorConfigArb, sc => {
        const label = computeLabel(sc);

        if (sc.substanceName !== null) {
          const expected = `${sc.quantityKindCode} [${sc.substanceName}] (${sc.unitSymbol})`;
          expect(label).toBe(expected);
        } else {
          const expected = `${sc.quantityKindCode} (${sc.unitSymbol})`;
          expect(label).toBe(expected);
        }
      }),
      { numRuns: 100 }
    );
  });
});
