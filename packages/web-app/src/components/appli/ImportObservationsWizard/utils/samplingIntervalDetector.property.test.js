/**
 * Feature: import-observations-csv
 *
 * Property-based tests for `detectSamplingInterval`.
 * Validates: Requirements 20.1
 */

import * as fc from 'fast-check';
import { detectSamplingInterval } from './samplingIntervalDetector';

// ---------------------------------------------------------------------------
// Property 8: sampling interval median
//
// What it constrains: for any array of 2+ valid ISO UTC strings, the result
//                     is the lower median of consecutive time differences in
//                     whole seconds.
// Encodes: the sampling interval detector must sort timestamps, compute
//          consecutive diffs in seconds, sort those diffs, and return the
//          lower median (index Math.floor((length - 1) / 2)).
// Covers: arrays of 2–50 random Date objects mapped to ISO strings, including
//         cases with duplicate dates (diff = 0).
//
// Note: dates are constrained to years 1000–9999 so that ISO strings always
// use the standard 4-digit year format (no leading "+" prefix). This ensures
// that lexicographic sort (used inside detectSamplingInterval) is equivalent
// to chronological sort — the same invariant that holds for all real-world
// data-logger timestamps.
// ---------------------------------------------------------------------------
describe('Property 8: sampling interval median — Validates: Requirements 20.1', () => {
  // Constrain dates to a safe range where toISOString() always works
  // and lexicographic sort equals chronological sort (4-digit years).
  const minDate = new Date('2000-01-01T00:00:00.000Z');
  const maxDate = new Date('2099-12-31T23:59:59.999Z');

  const timestampsArb = fc
    .array(fc.date({ min: minDate, max: maxDate, noInvalidDate: true }), {
      minLength: 2,
      maxLength: 50
    })
    .map(dates => dates.map(d => d.toISOString()));

  it('detectSamplingInterval returns the proper median of consecutive time diffs in seconds', () => {
    fc.assert(
      fc.property(timestampsArb, timestamps => {
        // Compute expected value manually:
        // 1. Sort the dates
        const sorted = [...timestamps].sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        // 2. Compute consecutive diffs in seconds (floor)
        const diffs = [];
        for (let i = 0; i < sorted.length - 1; i += 1) {
          const diffSeconds =
            (new Date(sorted[i + 1]).getTime() -
              new Date(sorted[i]).getTime()) /
            1000;
          diffs.push(diffSeconds);
        }

        // 3. Sort the diffs numerically
        diffs.sort((a, b) => a - b);

        // 4. Proper median: average the two middle values for even-length
        const mid = Math.floor(diffs.length / 2);
        const median =
          diffs.length % 2 === 0
            ? (diffs[mid - 1] + diffs[mid]) / 2
            : diffs[mid];
        const expectedMedian = Math.floor(median);

        // Assert
        const result = detectSamplingInterval(timestamps);
        expect(result).toBe(expectedMedian);
      }),
      { numRuns: 100 }
    );
  });
});
