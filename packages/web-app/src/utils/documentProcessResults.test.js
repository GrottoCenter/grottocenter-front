import fc from 'fast-check';
import {
  formatDocumentProcessSummary,
  isDocumentProcessFinished,
  normalizeDocumentProcessResults
} from './documentProcessResults';

describe('document process results', () => {
  it('returns each unique submitted ID in order for arbitrary untrusted responses', () => {
    const entry = fc.record({
      id: fc.oneof(fc.integer({ min: 1, max: 30 }), fc.string()),
      status: fc.oneof(
        fc.constantFrom(
          'validated',
          'rejected',
          'auto_rejected',
          'not_found',
          'error'
        ),
        fc.jsonValue()
      ),
      reason: fc.jsonValue()
    });
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 30 })),
        fc.oneof(fc.jsonValue(), fc.array(fc.oneof(entry, fc.jsonValue()))),
        (ids, response) => {
          const results = normalizeDocumentProcessResults(response, ids);
          expect(results.map(result => result.id)).toEqual([...new Set(ids)]);
          results.forEach(result => {
            if (result.status !== 'indeterminate') {
              expect(Array.isArray(response)).toBe(true);
              expect(
                response.filter(item => item?.id === result.id)
              ).toHaveLength(1);
              expect(
                result.reason === null || typeof result.reason === 'string'
              ).toBe(true);
            }
          });
        }
      )
    );
  });

  it('matches submitted IDs only, irrespective of result order', () => {
    const results = normalizeDocumentProcessResults(
      [
        { id: 2, status: 'auto_rejected', reason: 'Invalid file' },
        { id: 99, status: 'validated' },
        { id: 1, status: 'error', reason: 'Internal error' }
      ],
      [1, 2, 3]
    );
    expect(results).toEqual([
      { id: 1, status: 'error', reason: 'Internal error' },
      { id: 2, status: 'auto_rejected', reason: 'Invalid file' },
      { id: 3, status: 'indeterminate', reason: null }
    ]);
    expect(
      results.filter(isDocumentProcessFinished).map(item => item.id)
    ).toEqual([2]);
  });

  it.each([null, undefined, {}, 'invalid', [null], []])(
    'does not infer success from an invalid response %j',
    response => {
      expect(normalizeDocumentProcessResults(response, [1])).toEqual([
        { id: 1, status: 'indeterminate', reason: null }
      ]);
    }
  );

  it.each([
    [{ id: 1, status: 'unknown' }],
    [{ id: '1', status: 'validated' }],
    [{ id: 1, status: 'validated', reason: {} }],
    [{ id: 1, status: 'auto_rejected' }],
    [
      { id: 1, status: 'validated' },
      { id: 1, status: 'error' }
    ]
  ])('marks ambiguous or malformed results as indeterminate', response => {
    expect(normalizeDocumentProcessResults(response, [1])[0].status).toBe(
      'indeterminate'
    );
  });

  it('counts results, not requested actions or unrelated IDs', () => {
    const formatMessage = vi.fn(
      ({ id }, { count }) => `${id.split('.').at(-1)}:${count}`
    );
    expect(
      formatDocumentProcessSummary(
        [
          { status: 'validated' },
          { status: 'validated' },
          { status: 'auto_rejected' },
          { status: 'error' }
        ],
        formatMessage
      )
    ).toBe('validated:2, auto_rejected:1, error:1');
  });
});
