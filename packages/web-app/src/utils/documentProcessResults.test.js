import {
  formatDocumentProcessSummary,
  isDocumentProcessFinished,
  normalizeDocumentProcessResults
} from './documentProcessResults';

describe('document process results', () => {
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
