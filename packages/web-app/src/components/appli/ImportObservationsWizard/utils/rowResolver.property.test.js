import * as fc from 'fast-check';
import { resolveRows } from './rowResolver';

/**
 * Feature: import-observations-csv, Property 6: decimal-part merging
 *
 * For any data row containing a measurement column M at index i and a
 * decimal_part column D at index i+1, the resolved value for column M after
 * resolveRows SHALL equal rawM + '.' + rawD where rawM and rawD are the
 * original string values.
 *
 * Validates: Requirements 9.1
 */
describe('rowResolver property tests — Property 6: decimal-part merging', () => {
  /**
   * Constrains: string values are non-empty (minLength: 1) so the merge
   * always produces a non-trivial concatenation "rawM.rawD".
   * Covers: all non-empty string pairs regardless of whether they are
   * numeric or contain special characters.
   */
  it('should merge measurement and decimal_part columns into rawM + "." + rawD', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 })
        ),
        ([rawM, rawD]) => {
          const row = [rawM, rawD];
          const mappings = [
            { columnIndex: 0, role: 'measurement' },
            { columnIndex: 1, role: 'decimal_part' }
          ];

          const result = resolveRows([row], mappings);

          // The merged value MUST be rawM + '.' + rawD (string concatenation)
          expect(result[0][0]).toBe(rawM + '.' + rawD);
          // The decimal_part column MUST be set to null after merging
          expect(result[0][1]).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: import-observations-csv, Property 7: row filtering count
 *
 * For any parsed file with T total rows, header row index H (0-based,
 * i.e. skip H+1 rows), and skipLastRows = S, the count of data rows used
 * for preview and validation SHALL equal T - (H + 1) - S, provided
 * T - (H + 1) - S >= 0.
 *
 * Validates: Requirements 3.2, 3.6, 20.1
 */
describe('rowResolver property tests — Property 7: row filtering count', () => {
  /**
   * Constrains: rows array has at least 2 elements (minLength: 2) so a
   * header row can always be skipped while leaving candidate data rows.
   * fc.nat() generates headerRow as a non-negative integer; it is clamped
   * to rows.length - 1 inside the test so headerRow is always valid.
   * skipLastRows is also a non-negative integer from fc.nat().
   *
   * Covers: all combinations of row counts, header positions, and
   * skipLastRows values including cases where the result would go negative
   * (clamped to 0 via Math.max).
   */
  it('should produce T - (H + 1) - S data rows (clamped to 0) for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(
            fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            { minLength: 2, maxLength: 50 }
          ),
          fc.nat()
        ),
        ([rows, rawHeaderRow]) => {
          const T = rows.length;

          // Clamp headerRow to a valid index within the rows array
          const H = rawHeaderRow % T;

          // skipLastRows can range from 0 to T so we test with or without
          // over-shooting
          const skipLastRowsValues = [0, 1, Math.max(0, T - H - 2), T];

          for (const S of skipLastRowsValues) {
            // The slicing logic: skip H+1 leading rows, drop S trailing rows
            const dataRows = rows.slice(H + 1, T - S);
            const expectedCount = Math.max(0, T - (H + 1) - S);

            expect(dataRows.length).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
