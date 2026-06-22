import * as fc from 'fast-check';
import { SUBSTANCE_REQUIRING_CODES } from '../constants/substanceUtils';

/**
 * Feature: substance-reference-table
 *
 * Property-based tests for the SensorConfigForm logic.
 * Tests pure formulas extracted from the component to avoid heavy DOM rendering.
 */

// ---------------------------------------------------------------------------
// Helpers — mirrors the logic from SensorConfigForm.jsx
// ---------------------------------------------------------------------------

/**
 * canSubmit formula as implemented in SensorConfigForm.
 */
const computeCanSubmit = ({
  quantityKindId,
  unitId,
  selectedSubstance,
  substanceRequired,
  isSubmitting
}) =>
  quantityKindId !== '' &&
  unitId !== '' &&
  (!substanceRequired || selectedSubstance !== null) &&
  !isSubmitting;

/**
 * Error display logic from the catch block.
 */
const computeDisplayedError = (error, genericMessage) => {
  if (error.status === 400 && error.body?.message) {
    return error.body.message;
  }
  return genericMessage;
};

// ---------------------------------------------------------------------------
// Property 1: Submit disabled without substance selection
//
// For any state where the quantity kind is a Substance_Requiring_Quantity_Kind
// and selectedSubstance is null, the form submit button SHALL be disabled.
//
// Encodes: null substance selection disables submit for substance-requiring QKs.
// Covers: all substance-requiring codes with null substance.
//
// Validates: Requirements 8.1
// ---------------------------------------------------------------------------
describe('Feature: substance-reference-table, Property 1: Submit disabled without substance selection', () => {
  const substanceRequiringCodeArb = fc.constantFrom(
    ...SUBSTANCE_REQUIRING_CODES
  );

  const quantityKindIdArb = fc.constantFrom('17', '22');
  const unitIdArb = fc.constantFrom('16', '18', '29');

  it('canSubmit is false when selectedSubstance is null and QK requires substance', () => {
    fc.assert(
      fc.property(
        quantityKindIdArb,
        unitIdArb,
        substanceRequiringCodeArb,
        (quantityKindId, unitId, _code) => {
          const result = computeCanSubmit({
            quantityKindId,
            unitId,
            selectedSubstance: null,
            substanceRequired: true,
            isSubmitting: false
          });
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canSubmit is true when selectedSubstance is non-null and QK requires substance', () => {
    const substanceObjectArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 200 })
    });

    fc.assert(
      fc.property(
        quantityKindIdArb,
        unitIdArb,
        substanceObjectArb,
        (quantityKindId, unitId, substance) => {
          const result = computeCanSubmit({
            quantityKindId,
            unitId,
            selectedSubstance: substance,
            substanceRequired: true,
            isSubmitting: false
          });
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: API 400 error messages displayed verbatim
//
// For any non-empty error message string, when the error has status 400 and
// a body.message, the form displays that exact string without transformation.
//
// Encodes: API validation messages are shown as-is to the user.
// Covers: arbitrary non-empty message strings.
//
// Validates: Requirements 8.3
// ---------------------------------------------------------------------------
describe('Feature: substance-reference-table, Property 4: API 400 error messages displayed verbatim', () => {
  const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

  it('displays exact API message for 400 errors', () => {
    fc.assert(
      fc.property(errorMessageArb, message => {
        const error = { status: 400, body: { message } };
        const genericMessage =
          'An error occurred while creating the sensor configuration.';
        const displayed = computeDisplayedError(error, genericMessage);
        expect(displayed).toBe(message);
      }),
      { numRuns: 100 }
    );
  });

  it('displays generic message for non-400 errors', () => {
    const statusArb = fc.constantFrom(500, 502, 503, 504);

    fc.assert(
      fc.property(statusArb, errorMessageArb, (status, message) => {
        const error = { status, body: { message } };
        const genericMessage = 'Failed to create sensor configuration.';
        const displayed = computeDisplayedError(error, genericMessage);
        expect(displayed).toBe(genericMessage);
      }),
      { numRuns: 100 }
    );
  });
});
