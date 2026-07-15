import proj4 from 'proj4';
import { transformToWGS84, registerProjections } from './coordinateTransform';

// Mock proj4 so we don't need real projection definitions
vi.mock('proj4', () => {
  const registeredDefs = {};

  const proj4Mock = (source, target, coord) => {
    if (!registeredDefs[source]) {
      throw new Error(`No projection definition for ${source}`);
    }
    // Simulate a simple identity-ish transform for testing:
    // just return the coords reversed to prove transformation ran
    return [coord[1], coord[0]];
  };

  proj4Mock.defs = (code, definition) => {
    if (definition !== undefined) {
      registeredDefs[code] = definition;
      return;
    }
    return registeredDefs[code] || null;
  };

  return { default: proj4Mock };
});

beforeEach(() => {
  // Clear registered projections between tests by re-requiring
  // We'll register what we need per test
});

describe('registerProjections', () => {
  it('registers valid projections', () => {
    registerProjections([
      { code: 'EPSG:2154', definition: '+proj=lcc +lat_1=49 ...' }
    ]);
    expect(proj4.defs('EPSG:2154')).toBe('+proj=lcc +lat_1=49 ...');
  });

  it('skips entries missing code or definition', () => {
    registerProjections([
      { code: 'EPSG:9999' },
      { definition: '+proj=merc' },
      {}
    ]);
    expect(proj4.defs('EPSG:9999')).toBeNull();
  });

  it('does nothing when called with null/undefined', () => {
    expect(() => registerProjections(null)).not.toThrow();
    expect(() => registerProjections(undefined)).not.toThrow();
  });
});

describe('transformToWGS84', () => {
  it('returns coords unchanged for null/undefined CRS', () => {
    const coords = [2.3, 48.8];
    expect(transformToWGS84(coords, null)).toEqual(coords);
    expect(transformToWGS84(coords, undefined)).toEqual(coords);
  });

  it('returns coords unchanged for CRS84', () => {
    const coords = [2.3, 48.8];
    expect(transformToWGS84(coords, 'urn:ogc:def:crs:OGC:1.3:CRS84')).toEqual(
      coords
    );
  });

  it('returns coords unchanged for EPSG:4326', () => {
    const coords = [2.3, 48.8];
    expect(transformToWGS84(coords, 'EPSG:4326')).toEqual(coords);
  });

  it('throws on unknown CRS format', () => {
    expect(() => transformToWGS84([0, 0], 'SOME:RANDOM:CRS')).toThrow(
      'Unknown CRS format: SOME:RANDOM:CRS'
    );
  });

  it('parses EPSG code from URN format (double colon)', () => {
    registerProjections([
      { code: 'EPSG:2154', definition: '+proj=lcc +lat_1=49' }
    ]);
    const result = transformToWGS84(
      [700000, 6600000],
      'urn:ogc:def:crs:EPSG::2154'
    );
    // Our mock reverses coords to prove transform ran
    expect(result).toEqual([6600000, 700000]);
  });

  it('parses EPSG code from short format (single colon)', () => {
    registerProjections([
      { code: 'EPSG:2154', definition: '+proj=lcc +lat_1=49' }
    ]);
    const result = transformToWGS84([700000, 6600000], 'EPSG:2154');
    expect(result).toEqual([6600000, 700000]);
  });

  it('throws when projection is not registered', () => {
    expect(() => transformToWGS84([0, 0], 'EPSG:99999')).toThrow(
      /Projection EPSG:99999 is not registered/
    );
  });

  it('handles nested coordinates with depth > 0', () => {
    registerProjections([
      { code: 'EPSG:2154', definition: '+proj=lcc +lat_1=49' }
    ]);
    const ring = [
      [700000, 6600000],
      [700001, 6600001]
    ];
    const result = transformToWGS84(ring, 'EPSG:2154', 1);
    expect(result).toEqual([
      [6600000, 700000],
      [6600001, 700001]
    ]);
  });

  it('handles depth=2 for polygon coordinates', () => {
    registerProjections([
      { code: 'EPSG:2154', definition: '+proj=lcc +lat_1=49' }
    ]);
    const polygon = [
      [
        [700000, 6600000],
        [700001, 6600001]
      ]
    ];
    const result = transformToWGS84(polygon, 'EPSG:2154', 2);
    expect(result).toEqual([
      [
        [6600000, 700000],
        [6600001, 700001]
      ]
    ]);
  });
});
