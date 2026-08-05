/**
 * Feature: import-observations-csv
 *
 * Property-based tests for `buildTimestamp`.
 * Validates: Requirements 14.1, 14.2, 14.3, 8.1, 8.2, 8.3, 8.4
 */

import * as fc from 'fast-check';
import { format as formatDate } from 'date-fns';
import { toDateFnsFormat } from './momentToDateFnsFormat';
import { buildTimestamp } from './timestampBuilder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// moment-style format tokens (same convention the app stores in profiles)
const KNOWN_FORMATS = [
  'YYYY-MM-DD HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm:ss'
];

/**
 * Formats a UTC Date using a moment-style format string via date-fns.
 * Interprets the date's UTC fields (not local) to avoid timezone shifts.
 */
const formatUtc = (date, momentFmt) => {
  const dfFmt = toDateFnsFormat(momentFmt);
  // Create a local Date whose local fields match the UTC fields of the input
  const utcAsLocal = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
  return formatDate(utcAsLocal, dfFmt);
};

// ---------------------------------------------------------------------------
// Property 1: timestamp round-trip
//
// What it constrains: for any valid format and any date formatted with that
//   format, calling buildTimestamp and then re-formatting the result back to
//   the original format produces the original string.
// Encodes: parsing is lossless when the format is known and timezone is UTC
//   (no DST ambiguity).
// Covers: all KNOWN_FORMATS with random dates between 2000 and 2030.
// ---------------------------------------------------------------------------
describe('Property 1: timestamp round-trip — Validates: Requirements 14.1, 8.1, 8.2, 8.3', () => {
  it('buildTimestamp then re-formatting back produces the original string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...KNOWN_FORMATS),
        fc
          .date({
            min: new Date('2000-01-01T00:00:00Z'),
            max: new Date('2030-12-31T23:59:59Z'),
            noInvalidDate: true
          })
          .filter(d => !Number.isNaN(d.getTime())),
        (fmt, date) => {
          // Truncate date to whole seconds (format has no sub-second precision)
          const truncated = new Date(Math.floor(date.getTime() / 1000) * 1000);

          // Format the date as a string using date-fns (UTC to avoid TZ shift)
          const dateStr = formatUtc(truncated, fmt);

          // Build the row and mappings for buildTimestamp
          const row = [dateStr];
          const mappings = [
            {
              columnIndex: 0,
              role: 'timestamp',
              timestampType: 'datetime',
              dateFormat: fmt,
              timezone: 'UTC'
            }
          ];

          // Call buildTimestamp with UTC timezone
          const isoResult = buildTimestamp(row, mappings, 'UTC');

          // The result should be a valid ISO string
          expect(isoResult).not.toBeNull();

          // Parse the ISO result back to a Date and re-format with same format
          const resultDate = new Date(isoResult);
          const reformatted = formatUtc(resultDate, fmt);

          expect(reformatted).toBe(dateStr);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: elapsed_seconds accumulation
//
// What it constrains: for any base timestamp and array of elapsed_seconds
//   values, the result equals the base timestamp plus sum(values) * 1000 ms.
// Encodes: elapsed_seconds columns are additive offsets from the base date.
// Covers: arbitrary arrays of positive float elapsed values up to 3600s.
// ---------------------------------------------------------------------------
describe('Property 2: elapsed_seconds accumulation — Validates: Requirements 14.2, 8.4', () => {
  it('result equals base + sum(elapsed) * 1000 ms', () => {
    const BASE_STR = '2024-01-01 00:00:00';
    const BASE_FMT = 'YYYY-MM-DD HH:mm:ss';
    const baseMs = Date.UTC(2024, 0, 1, 0, 0, 0, 0);

    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 3600, noNaN: true }), {
          minLength: 1,
          maxLength: 20
        }),
        elapsedValues => {
          // Build the row: first column is the base datetime,
          // subsequent columns are elapsed_seconds values
          const row = [BASE_STR, ...elapsedValues.map(String)];

          // Build mappings: datetime at index 0, elapsed_seconds at 1..N
          const mappings = [
            {
              columnIndex: 0,
              role: 'timestamp',
              timestampType: 'datetime',
              dateFormat: BASE_FMT,
              timezone: 'UTC'
            },
            ...elapsedValues.map((_, i) => ({
              columnIndex: i + 1,
              role: 'timestamp',
              timestampType: 'elapsed_seconds'
            }))
          ];

          const isoResult = buildTimestamp(row, mappings, 'UTC');
          expect(isoResult).not.toBeNull();

          const resultMs = new Date(isoResult).getTime();
          const totalElapsedMs = elapsedValues.reduce(
            (sum, v) => sum + v * 1000,
            0
          );
          const expectedMs = baseMs + totalElapsedMs;

          // Allow 1ms tolerance for floating-point arithmetic
          expect(Math.abs(resultMs - expectedMs)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
