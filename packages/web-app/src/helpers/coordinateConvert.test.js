import { parseCoordinateString } from './coordinateConvert';

// Real projection definitions — no proj4 mock needed (proj4 is CJS, works in Jest directly).
// Using these avoids brittle mocks and exercises the real coordinate math.

const EPSG_2154 = {
  code: 'EPSG:2154',
  definition:
    '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +units=m +no_defs',
  units: 'metric',
  proj: 'lcc'
};

// EPSG:27573 = NTF (Paris) / Lambert zone III carto — y_0=3 200 000 (zone number embedded)
// This is distinct from EPSG:27563 (Lambert III standard, y_0=200 000).
const EPSG_27573 = {
  code: 'EPSG:27573',
  definition:
    '+proj=lcc +lat_0=43.1666666667 +lon_0=0 +lat_1=44.1 +lat_2=42.1666666667 +x_0=600000 +y_0=3200000 +pm=paris +ellps=clrk80ign +towgs84=-168,-60,320,0,0,0,0 +units=m +no_defs',
  units: 'metric',
  proj: 'lcc'
};

// Loose France bounds for result sanity checks
const inFrance = result =>
  result !== null &&
  result.lat >= 41 && result.lat <= 52 &&
  result.lng >= -6 && result.lng <= 10;

describe('parseCoordinateString', () => {
  describe('WGS84 decimal', () => {
    it('parses signed decimal', () => {
      const result = parseCoordinateString('45.1179, 5.4786');
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(45.1179);
      expect(result.lng).toBeCloseTo(5.4786);
      expect(result.format).toBe('WGS84');
    });

    it('parses negative coordinates (southern/western hemisphere)', () => {
      const result = parseCoordinateString('-33.8688, 151.2093');
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(-33.8688);
      expect(result.lng).toBeCloseTo(151.2093);
      expect(result.format).toBe('WGS84');
    });

    it('parses decimal comma separator (French locale)', () => {
      const result = parseCoordinateString('45,1179 5,4786');
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(45.1179);
      expect(result.lng).toBeCloseTo(5.4786);
      expect(result.format).toBe('WGS84');
    });
  });

  describe('WGS84 decimal cardinal', () => {
    it('parses decimal with degree symbol and cardinal', () => {
      const result = parseCoordinateString('45.1179° N, 5.4786° E');
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(45.1179);
      expect(result.lng).toBeCloseTo(5.4786);
      expect(result.format).toBe('WGS84');
    });
  });

  describe('DMS', () => {
    it('parses degrees minutes seconds with N/E', () => {
      const result = parseCoordinateString("45° 7' 4.6\" N, 5° 28' 43\" E");
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(45.118, 2);
      expect(result.format).toBe('DMS');
    });
  });

  describe('DDM', () => {
    it('parses decimal degrees minutes with N/E prefix', () => {
      const result = parseCoordinateString('N 45° 07.066 E 005° 28.717');
      expect(result).not.toBeNull();
      expect(result.lat).toBeCloseTo(45.1178, 2);
      expect(result.format).toBe('WGS84');
    });
  });

  describe('Lambert 93', () => {
    it('parses X Y order (easting, northing)', () => {
      const result = parseCoordinateString('843000, 6450000', [EPSG_2154]);
      expect(inFrance(result)).toBe(true);
      expect(result.format).toBe('Lambert 93');
    });

    it('parses Y X order (northing, easting) — inverted', () => {
      const resultNormal = parseCoordinateString('843000, 6450000', [EPSG_2154]);
      const resultInverted = parseCoordinateString('6450000, 843000', [EPSG_2154]);
      expect(inFrance(resultInverted)).toBe(true);
      expect(resultInverted.format).toBe('Lambert 93');
      expect(resultInverted.lat).toBeCloseTo(resultNormal.lat, 4);
      expect(resultInverted.lng).toBeCloseTo(resultNormal.lng, 4);
    });

    it('returns null when no projections provided', () => {
      expect(parseCoordinateString('843000, 6450000')).toBeNull();
    });

    it('returns null for values outside French Lambert 93 range', () => {
      expect(parseCoordinateString('999999999, 111111111', [EPSG_2154])).toBeNull();
    });
  });

  describe('Lambert III carto', () => {
    it('parses X Y order (easting, northing)', () => {
      // Montpellier area in Lambert III carto ≈ (722000, 3165000)
      const result = parseCoordinateString('722000, 3165000', [EPSG_27573]);
      expect(inFrance(result)).toBe(true);
      expect(result.format).toBe('Lambert III carto');
    });

    it('parses Y X order (northing, easting) — inverted', () => {
      const resultNormal = parseCoordinateString('722000, 3165000', [EPSG_27573]);
      const resultInverted = parseCoordinateString('3165000, 722000', [EPSG_27573]);
      expect(inFrance(resultInverted)).toBe(true);
      expect(resultInverted.format).toBe('Lambert III carto');
      expect(resultInverted.lat).toBeCloseTo(resultNormal.lat, 4);
      expect(resultInverted.lng).toBeCloseTo(resultNormal.lng, 4);
    });

    it('returns null when no projections provided', () => {
      expect(parseCoordinateString('722000, 3165000')).toBeNull();
    });
  });

  describe('negative cases', () => {
    it('returns null for plain text', () => {
      expect(parseCoordinateString('azerty')).toBeNull();
    });

    it('returns null for a single number', () => {
      expect(parseCoordinateString('45.1179')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseCoordinateString('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseCoordinateString(null)).toBeNull();
    });
  });
});
