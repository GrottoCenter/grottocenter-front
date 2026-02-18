import fc from 'fast-check';
import { makeUrl } from './utils';

/**
 * Property 2: makeUrl includes all criteria keys
 *
 * For any criteria object passed to makeUrl, every key in the object
 * SHALL appear as a query parameter in the resulting URL, and no extra
 * query parameters SHALL be present.
 *
 * Validates: Requirements 4.1, 4.2
 */
describe('makeUrl property tests', () => {
  const baseUrl = 'https://api.example.com/endpoint';

  it('should include every criteria key as a query parameter and no extras', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/).filter(
            (s) => s.length > 0
          ),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.float({ noNaN: true, noDefaultInfinity: true })
          )
        ),
        (criteria) => {
          const url = makeUrl(baseUrl, criteria);
          const keys = Object.keys(criteria);

          if (keys.length === 0) {
            // Empty object still produces '?' with no params
            expect(url).toBe(`${baseUrl}?`);
            return;
          }

          // Parse the query string from the result
          const queryString = url.split('?')[1];
          const params = new URLSearchParams(queryString);
          const paramKeys = [...params.keys()];

          // Every criteria key appears as a query parameter
          keys.forEach((key) => {
            expect(paramKeys).toContain(key);
          });

          // No extra query parameters beyond the criteria keys
          expect(paramKeys.length).toBe(keys.length);

          // Each value is the URI-encoded version of the original
          keys.forEach((key) => {
            expect(params.get(key)).toBe(
              String(criteria[key])
            );
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return the base URL unchanged when criteria is undefined', () => {
    expect(makeUrl(baseUrl, undefined)).toBe(baseUrl);
  });

  it('should return the base URL unchanged when criteria is null', () => {
    expect(makeUrl(baseUrl, null)).toBe(baseUrl);
  });
});
