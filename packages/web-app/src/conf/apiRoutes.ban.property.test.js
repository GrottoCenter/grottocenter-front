import fc from 'fast-check';
import { banCaverUrl, unbanCaverUrl } from './apiRoutes';

/**
 * Property 1: Ban/Unban URL construction
 *
 * For any caverId value, banCaverUrl(caverId) returns a string ending with
 * /cavers/${caverId}/ban and unbanCaverUrl(caverId) returns a string ending
 * with /cavers/${caverId}/unban, both prefixed with the API base path.
 *
 * Encodes: API route centralization — URLs follow the REST convention.
 * Covers: integer and string caverId values.
 *
 * Validates: Requirements 1.1, 1.2
 */
describe('Property 1: Ban/Unban URL construction', () => {
  const caverIdArb = fc.oneof(
    fc.integer({ min: 1, max: 999999 }),
    fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/)
  );

  it('banCaverUrl produces correct path for any caverId', () => {
    fc.assert(
      fc.property(caverIdArb, caverId => {
        const url = banCaverUrl(caverId);
        expect(url).toContain('/api/v1/cavers/');
        expect(url).toMatch(new RegExp(`/cavers/${String(caverId)}/ban$`));
      }),
      { numRuns: 100 }
    );
  });

  it('unbanCaverUrl produces correct path for any caverId', () => {
    fc.assert(
      fc.property(caverIdArb, caverId => {
        const url = unbanCaverUrl(caverId);
        expect(url).toContain('/api/v1/cavers/');
        expect(url).toMatch(new RegExp(`/cavers/${String(caverId)}/unban$`));
      }),
      { numRuns: 100 }
    );
  });
});
