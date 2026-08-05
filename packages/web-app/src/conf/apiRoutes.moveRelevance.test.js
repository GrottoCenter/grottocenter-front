import fc from 'fast-check';
import {
  moveLocationRelevanceUrl,
  moveDescriptionRelevanceUrl,
  moveCommentRelevanceUrl,
  moveRiggingRelevanceUrl,
  moveHistoryRelevanceUrl
} from './apiRoutes';

/**
 * Property 4: URL builder correctness
 * Validates: Requirements 5.1, 5.2
 *
 * For any entity type in {location, description, comment, rigging, history}
 * and any positive integer ID, the corresponding URL builder function should
 * return a string matching the pattern
 * /api/v1/<pluralEntityType>/<id>/move-relevance.
 */
describe('Property 4: URL builder correctness', () => {
  const builders = [
    { fn: moveLocationRelevanceUrl, plural: 'locations' },
    { fn: moveDescriptionRelevanceUrl, plural: 'descriptions' },
    { fn: moveCommentRelevanceUrl, plural: 'comments' },
    { fn: moveRiggingRelevanceUrl, plural: 'riggings' },
    { fn: moveHistoryRelevanceUrl, plural: 'histories' }
  ];

  builders.forEach(({ fn, plural }) => {
    it(`${plural} URL builder produces correct path for any positive ID`, () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 999999 }), id => {
          const url = fn(id);
          return url.endsWith(`/${plural}/${id}/move-relevance`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
