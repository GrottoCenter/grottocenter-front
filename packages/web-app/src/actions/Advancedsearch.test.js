import fc from 'fast-check';
import { downloadAdvancedSearchResults } from './Advancedsearch';

// The action calls the global `fetch` directly (isomorphic-fetch was removed
// in Phase I3). Stub the global in beforeEach; restore in afterEach.
const mockFetch = vi.fn();

// Mock apiRoutes
vi.mock('../conf/apiRoutes', () => ({
  advancedSearchUrl: 'http://api/advanced-search',
  advancedSearchExportUrl: 'http://api/advanced-search/export'
}));

// Mock utils
vi.mock('./utils', () => ({
  checkAndGetStatus: response => response
}));

describe('downloadAdvancedSearchResults', () => {
  let anchorElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    window.URL.createObjectURL = vi
      .fn()
      .mockReturnValue('blob:http://localhost/fake');
    window.URL.revokeObjectURL = vi.fn();

    anchorElement = document.createElement('a');
    vi.spyOn(anchorElement, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(anchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const setupFetchBlob = () => {
    const fakeBlob = new Blob(['data'], { type: 'text/plain' });
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(fakeBlob) });
  };

  it('appends ?format=csv when format is "csv"', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances',
      format: 'csv'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=csv',
      expect.any(Object)
    );
  });

  it('appends ?format=geojson when format is "geojson"', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances',
      format: 'geojson'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=geojson',
      expect.any(Object)
    );
  });

  it('appends ?format=gpx when format is "gpx"', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances',
      format: 'gpx'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=gpx',
      expect.any(Object)
    );
  });

  it('appends ?format=kml when format is "kml"', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances',
      format: 'kml'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=kml',
      expect.any(Object)
    );
  });

  it('defaults to ?format=csv when format is undefined', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=csv',
      expect.any(Object)
    );
  });

  it('uses correct file extension for each format', async () => {
    const formats = [
      { format: 'csv', ext: 'csv' },
      { format: 'geojson', ext: 'geojson' },
      { format: 'gpx', ext: 'gpx' },
      { format: 'kml', ext: 'kml' }
    ];

    for (const { format, ext } of formats) {
      setupFetchBlob();

      // One format at a time: each iteration re-arms the fetch mock and then
      // asserts on the single anchor element they all share.
      // eslint-disable-next-line no-await-in-loop
      await downloadAdvancedSearchResults({
        query: 'test',
        entity: 'entrances',
        format
      });

      expect(anchorElement.download).toMatch(
        new RegExp(`Grottocenter_search_export_\\d+\\.${ext}$`)
      );
    }
  });

  it('falls back to csv for an unsupported format value', async () => {
    setupFetchBlob();
    await downloadAdvancedSearchResults({
      query: 'test',
      entity: 'entrances',
      format: 'xlsx'
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api/advanced-search/export?format=csv',
      expect.any(Object)
    );
    expect(anchorElement.download).toMatch(
      /Grottocenter_search_export_\d+\.csv$/
    );
  });

  it('should produce correct URL and filename for any supported format', async () => {
    const formatArb = fc.constantFrom('csv', 'geojson', 'gpx', 'kml');

    await fc.assert(
      fc.asyncProperty(formatArb, async format => {
        setupFetchBlob();

        await downloadAdvancedSearchResults({
          query: 'test',
          entity: 'entrances',
          format
        });

        expect(mockFetch).toHaveBeenCalledWith(
          `http://api/advanced-search/export?format=${format}`,
          expect.any(Object)
        );
        expect(anchorElement.download).toMatch(new RegExp(`\\.${format}$`));
      }),
      { numRuns: 50 }
    );
  });

  it('should fall back to csv for any unsupported format string', async () => {
    const unsupportedArb = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter(s => !['csv', 'geojson', 'gpx', 'kml'].includes(s));

    await fc.assert(
      fc.asyncProperty(unsupportedArb, async format => {
        setupFetchBlob();

        await downloadAdvancedSearchResults({
          query: 'test',
          entity: 'entrances',
          format
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'http://api/advanced-search/export?format=csv',
          expect.any(Object)
        );
        expect(anchorElement.download).toMatch(
          /Grottocenter_search_export_\d+\.csv$/
        );
      }),
      { numRuns: 50 }
    );
  });
});
