/**
 * Feature: import-observations-csv
 *
 * Property-based tests for `normalizeNumber`.
 * Validates: Requirements 15.1, 15.2, 15.3, 4.2, 4.3
 */

import * as fc from 'fast-check';
import { normalizeNumber } from './numberNormalizer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a dot-decimal string from integer and fractional parts.
 * Produces strings like "123.45", "-7.00", "0.99".
 * Avoids scientific notation by constraining values to a safe range.
 */
const dotDecimalString = fc
  .tuple(
    fc.integer({ min: -999999, max: 999999 }),
    fc.integer({ min: 0, max: 99 }),
  )
  .map(([intPart, fracPart]) => {
    const frac = String(fracPart).padStart(2, '0');
    return `${intPart}.${frac}`;
  });

/**
 * Build a comma-decimal string from integer and fractional parts.
 * Produces strings like "123,45", "-7,00", "0,99".
 * Mirrors the dot-decimal format but with a comma as the decimal separator.
 */
const commaDecimalString = fc
  .tuple(
    fc.integer({ min: -999999, max: 999999 }),
    fc.integer({ min: 0, max: 99 }),
  )
  .map(([intPart, fracPart]) => {
    const frac = String(fracPart).padStart(2, '0');
    return `${intPart},${frac}`;
  });

// ---------------------------------------------------------------------------
// Property 3: dot-decimal round-trip
//
// What it constrains: parsing a dot-decimal string recovers the original value.
// Encodes: the 'en' locale branch strips commas (thousands separators) and
//          delegates to parseFloat, which must invert the formatting exactly.
// Covers: any integer with a two-digit fractional part — no scientific notation.
// ---------------------------------------------------------------------------
describe('Property 3: dot-decimal round-trip — Validates: Requirements 15.1, 4.3', () => {
  it('normalizeNumber(dotDecimalStr, "en") returns the original numeric value', () => {
    fc.assert(
      fc.property(dotDecimalString, str => {
        const expected = parseFloat(str);
        const result = normalizeNumber(str, 'en');
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: comma-decimal round-trip
//
// What it constrains: parsing a comma-decimal string recovers the original value.
// Encodes: the 'fr' locale branch strips dots/spaces (thousands separators),
//          replaces the comma with a dot, then delegates to parseFloat.
// Covers: any integer with a two-digit fractional part — no scientific notation.
// ---------------------------------------------------------------------------
describe('Property 4: comma-decimal round-trip — Validates: Requirements 15.2, 4.2', () => {
  it('normalizeNumber(commaDecimalStr, "fr") returns the original numeric value', () => {
    fc.assert(
      fc.property(commaDecimalString, str => {
        // Derive the expected value by converting the comma string to dot form
        const expected = parseFloat(str.replace(',', '.'));
        const result = normalizeNumber(str, 'fr');
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: output finiteness
//
// What it constrains: whenever normalizeNumber returns non-null, the value is
//                     a finite JavaScript number.
// Encodes: the function's contract that null is the sentinel for "not a number"
//          and that Infinity / -Infinity are never returned.
// Covers: all possible string inputs, including adversarial ones.
// ---------------------------------------------------------------------------
describe('Property 5: output finiteness — Validates: Requirements 15.3', () => {
  it('if normalizeNumber returns non-null, the result is Number.isFinite', () => {
    fc.assert(
      fc.property(fc.string(), str => {
        const result = normalizeNumber(str, 'en');
        if (result !== null) {
          expect(Number.isFinite(result)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});
