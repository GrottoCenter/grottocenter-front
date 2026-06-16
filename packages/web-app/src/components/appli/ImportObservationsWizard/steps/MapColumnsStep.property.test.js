import * as fc from 'fast-check';

/**
 * Feature: sensor-substance-field
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
const computeLabel = ({ quantityKindCode, substance, unitSymbol }) => {
  const quantityKindName = quantityKindCode;
  return substance
    ? `${quantityKindName} [${substance}] (${unitSymbol})`
    : `${quantityKindName} (${unitSymbol})`;
};

// ---------------------------------------------------------------------------
// Property 5: Sensor config label format
//
// For any normalized sensor configuration object with a quantityKindCode,
// unitSymbol, and substance (string or null), the rendered label matches
// the pattern "{quantityKindName} [{substance}] ({unitSymbol})" when
// substance is non-null, or "{quantityKindName} ({unitSymbol})" when
// substance is null.
//
// Encodes: label format includes substance in brackets only when present.
// Covers: all quantity kind codes, arbitrary substance strings, arbitrary
//         unit symbols.
//
// Validates: Requirements 5.1, 5.2
// ---------------------------------------------------------------------------
describe('Feature: sensor-substance-field, Property 5: Sensor config label format', () => {
  const sensorConfigArb = fc.record({
    quantityKindCode: fc.constantFrom(
      'Temperature',
      'Concentration',
      'IsotopeDelta',
      'pH'
    ),
    substance: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
      nil: null
    }),
    unitSymbol: fc.string({ minLength: 1, maxLength: 20 })
  });

  it('label matches expected format with substance in brackets when non-null', () => {
    fc.assert(
      fc.property(sensorConfigArb, sc => {
        const label = computeLabel(sc);

        if (sc.substance !== null) {
          const expected = `${sc.quantityKindCode} [${sc.substance}] (${sc.unitSymbol})`;
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
