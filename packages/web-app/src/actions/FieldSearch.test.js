import { fetchFieldSearch } from './FieldSearch';

describe('fetchFieldSearch document scope', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ hits: [] })
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([true, false])(
    'includes pending documents in suggestions only when requested: %s',
    async includePendingDocuments => {
      await fetchFieldSearch({
        entity: 'documents',
        field: 'library.name',
        query: 'test',
        filter: {},
        includePendingDocuments
      });

      const [, options] = fetch.mock.lastCall;
      const body = JSON.parse(options.body);
      expect(body.includePendingDocuments).toBe(
        includePendingDocuments ? true : undefined
      );
    }
  );
});
