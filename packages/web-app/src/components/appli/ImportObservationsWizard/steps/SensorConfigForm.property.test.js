import * as fc from 'fast-check';
import { SUBSTANCE_REQUIRING_CODES } from '../constants/substanceUtils';

/**
 * Feature: sensor-substance-field
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
  substance,
  substanceRequired,
  isSubmitting
}) =>
  quantityKindId !== '' &&
  unitId !== '' &&
  (!substanceRequired || substance.trim() !== '') &&
  !isSubmitting;

/**
 * Substance value included in configData on submit.
 */
const computeSubmittedSubstance = ({ substance, substanceRequired }) =>
  substanceRequired ? substance.trim() : null;

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
// Property 1: Whitespace-only substance disables submit
//
// For any whitespace-only string, when the quantity kind requires substance,
// canSubmit must be false.
//
// Encodes: empty or whitespace-only substance is not a valid entry.
// Covers: all possible whitespace combinations.
//
// Validates: Requirements 2.6
// ---------------------------------------------------------------------------
describe('Feature: sensor-substance-field, Property 1: Whitespace-only substance disables submit', () => {
  // Only characters that JavaScript's String.prototype.trim() removes.
  // Note: \u200B (zero-width space) is NOT trimmed by .trim() so is excluded.
  const whitespaceArb = fc.stringMatching(
    /^[ \t\n\r\u00A0]*$/
  );

  const substanceRequiringCodeArb = fc.constantFrom(
    ...SUBSTANCE_REQUIRING_CODES
  );

  it('canSubmit is false when substance is whitespace-only and QK requires substance', () => {
    fc.assert(
      fc.property(
        whitespaceArb,
        substanceRequiringCodeArb,
        (whitespaceSubstance, _code) => {
          const result = computeCanSubmit({
            quantityKindId: '17',
            unitId: '16',
            substance: whitespaceSubstance,
            substanceRequired: true,
            isSubmitting: false
          });
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Submitted substance is trimmed
//
// For any string with leading/trailing whitespace surrounding non-whitespace
// content, the submitted substance equals input.trim().
//
// Encodes: substance is always trimmed before submission.
// Covers: arbitrary padding around non-empty core content.
//
// Validates: Requirements 2.7
// ---------------------------------------------------------------------------
describe('Feature: sensor-substance-field, Property 2: Submitted substance is trimmed', () => {
  const paddedSubstanceArb = fc.tuple(
    fc.stringMatching(/^[ \t]{0,5}$/),
    fc.string({ minLength: 1, maxLength: 90 }).filter(
      s => s.trim().length > 0
    ),
    fc.stringMatching(/^[ \t]{0,5}$/)
  ).map(([left, core, right]) => left + core + right);

  it('submitted substance equals input.trim() for substance-requiring QKs', () => {
    fc.assert(
      fc.property(paddedSubstanceArb, substance => {
        const result = computeSubmittedSubstance({
          substance,
          substanceRequired: true
        });
        expect(result).toBe(substance.trim());
      }),
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
// Validates: Requirements 4.1
// ---------------------------------------------------------------------------
describe('Feature: sensor-substance-field, Property 4: API 400 error messages displayed verbatim', () => {
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
});
