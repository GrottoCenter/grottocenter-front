import proj4 from 'proj4';
import Coordinates from 'coordinate-parser';

// --- DMS conversions ---

export const decimalToDMS = (decimal, isLatitude) => {
  const abs = Math.abs(decimal);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(1);
  const direction = isLatitude
    ? decimal >= 0
      ? 'N'
      : 'S'
    : decimal >= 0
    ? 'E'
    : 'W';
  return `${deg}°${min}'${sec}"${direction}`;
};

// 'O' = Ouest (West) — French notation, same sign as 'W'.
const isNegativeDir = (sign, dir) => sign === '-' || (dir && /^[SWOswo]$/.test(dir));

// Accepts DMS: "48°31'24.2"N", "48 31 24.2 N", "48d31m24.2sN"
// Accepts DDM: "48°31.402'N"
// Returns NaN for plain decimals — callers handle the WGS84 decimal case separately.
export const parseDMS = str => {
  if (!str) return NaN;
  const cleaned = str.trim();
  const dmsMatch = cleaned.match(
    /^(-?)(\d+)\s*[°d]\s*(\d+)\s*[m']\s*(\d+(?:[.,]\d+)?)\s*[s"]?\s*([NSEWOnsewo])?$/
  );
  if (dmsMatch) {
    const [, sign, d, m, s, dir] = dmsMatch;
    let decimal = +d + +m / 60 + parseFloat(s.replace(',', '.')) / 3600;
    if (isNegativeDir(sign, dir)) decimal = -decimal;
    return decimal;
  }
  // DDM: "48°31.402'N" — degrees + decimal minutes
  const ddmMatch = cleaned.match(
    /^(-?)(\d+)\s*[°d]\s*(\d+(?:[.,]\d+)?)\s*[m']\s*([NSEWOnsewo])?$/
  );
  if (ddmMatch) {
    const [, sign, d, m, dir] = ddmMatch;
    let decimal = +d + parseFloat(m.replace(',', '.')) / 60;
    if (isNegativeDir(sign, dir)) decimal = -decimal;
    return decimal;
  }
  return NaN;
};

// --- UTM helpers ---

export const getUTMZone = lng => Math.floor((lng + 180) / 6) + 1;

const addZoneToUTM = (definition, zone) => {
  const parts = definition.split('+zone=');
  if (parts.length < 2) return definition;
  const rest = parts[1].replace(/^\d+/, '');
  return `${parts[0]}+zone=${zone}${rest}`;
};

const removeSouthFromUTM = definition => definition.replace(/\s*\+south\b/g, '');

export const buildUTMProjection = (definition, zone, hemisphere) => {
  let proj = addZoneToUTM(definition, zone);
  proj = removeSouthFromUTM(proj);
  if (hemisphere === 'South') proj += ' +south';
  return proj;
};

// --- Coordinate transformations ---

// Convert WGS84 to a projection's display values.
// Returns { x, y, zone?, hemisphere? } where:
//   x = first display field (Latitude for degree-based, Easting for metric)
//   y = second display field (Longitude for degree-based, Northing for metric)
// @throws if the projection definition is invalid or proj4 cannot convert the coordinates.
export const convertWGS84ToProjection = (lat, lng, projection) => {
  let def = projection.definition;
  let zone;
  let hemisphere;

  if (projection.proj === 'utm') {
    zone = getUTMZone(lng);
    hemisphere = lat >= 0 ? 'North' : 'South';
    def = buildUTMProjection(def, zone, hemisphere);
  }

  // proj4 geographic convention: [longitude, latitude]
  const [projX, projY] = proj4('EPSG:4326', def, [lng, lat]);

  if (projection.units === 'degrees') {
    // proj4 returns [out_lng, out_lat] for degree output → display as (lat, lng)
    return { x: projY, y: projX, zone, hemisphere };
  }
  // proj4 returns [Easting, Northing] for metric output
  return { x: projX, y: projY, zone, hemisphere };
};

// Convert projection display values (x=first field, y=second field) to WGS84.
//   x = Latitude (degrees) or Easting (metric)
//   y = Longitude (degrees) or Northing (metric)
// @throws if the projection definition is invalid or proj4 cannot convert the coordinates.
export const convertProjectionToWGS84 = (
  x,
  y,
  projection,
  utmZone,
  utmHemisphere = 'North'
) => {
  let def = projection.definition;

  if (projection.proj === 'utm') {
    def = buildUTMProjection(def, utmZone, utmHemisphere);
  }

  // For degrees: display is (lat=x, lng=y) but proj4 needs [lng, lat]
  // For metric: display is (Easting=x, Northing=y) and proj4 needs [x, y]
  const proj4Input =
    projection.units === 'degrees'
      ? [parseFloat(y), parseFloat(x)]
      : [parseFloat(x), parseFloat(y)];

  const [outLng, outLat] = proj4(def, 'EPSG:4326', proj4Input);
  return { lat: outLat, lng: outLng };
};

// --- Display helpers ---

// Canonical WGS84 display format: "46.3002° N, 6.5774° E"
export const formatWGS84 = (lat, lng, decimals = 4) => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}° ${latDir}, ${Math.abs(lng).toFixed(decimals)}° ${lngDir}`;
};

// --- Coordinate string parsing ---

const tryProjectedConversion = (easting, northing, projection, format) => {
  if (!projection) return null;
  try {
    const result = convertProjectionToWGS84(easting, northing, projection);
    if (result.lat >= -90 && result.lat <= 90 && result.lng >= -180 && result.lng <= 180)
      return { lat: result.lat, lng: result.lng, format };
    return null;
  } catch {
    return null;
  }
};

// Heuristic ranges for projected CRSes — never overlap with WGS84 decimal values (max ±180),
// so safe to check before coordinate-parser which would misinterpret e.g. "843000" as DMS 84°30'00".
const PROJECTED_CRS_RANGES = [
  {
    code: 'EPSG:2154',
    name: 'Lambert 93',
    // geographic extent: W=-9.86° E=10.38° S=41.15° N=51.56° → X_max ≈ 1 317 000 m
    easting: [50_000, 1_320_000],
    northing: [6_000_000, 7_220_000]
  },
  {
    code: 'EPSG:27573',
    name: 'Lambert III carto',
    // geographic extent: south France 42°-45.5°N → X: ~260k–1 150k m, Y: ~3 050k–3 460k m
    easting: [50_000, 1_200_000],
    northing: [3_000_000, 3_500_000]
  }
];

const inRange = (v, [min, max]) => v >= min && v <= max;

// Matches arcminutes/arcseconds indicators only — not ° or cardinals alone,
// which appear in plain decimal-degree notation like "43.4659° N, 3.5835° E".
const DMS_INDICATOR_RE = /['"]|[ms]/;

// Replaces standalone 'O' (Ouest) with 'W' so all parsing paths see standard cardinals.
const normalizeWest = input => input.replace(/(^|[^a-z0-9])[Oo](?![a-z0-9])/gi, '$1W');

const detectProjectedPair = (a, b) => {
  for (const crs of PROJECTED_CRS_RANGES) {
    if (inRange(a, crs.easting) && inRange(b, crs.northing))
      return { easting: a, northing: b, crs };
    if (inRange(a, crs.northing) && inRange(b, crs.easting))
      return { easting: b, northing: a, crs };
  }
  return null;
};

// Parses a free-form coordinate string into { lat, lng, format } or null.
// Supported formats: WGS84 decimal, DMS, DDM (via coordinate-parser),
// and projected CRSes listed in PROJECTED_CRS_RANGES (via heuristic range detection).
// projections: array of projection objects from the store — same shape as formatCoordinatesForCopy.
export const parseCoordinateString = (input, projections = []) => {
  if (!input || typeof input !== 'string') return null;

  // Normalize standalone 'O' (Ouest) to 'W' once so all subsequent paths see standard cardinals.
  const normalized = normalizeWest(input.trim());
  const hasDMS = DMS_INDICATOR_RE.test(normalized);

  const nums = normalized.match(/-?\d[\d.,]*/g);
  if (nums && nums.length === 2) {
    const a = parseFloat(nums[0].replace(',', '.'));
    const b = parseFloat(nums[1].replace(',', '.'));
    const detected = detectProjectedPair(a, b);

    if (detected) {
      const projection = projections.find(p => p.code === detected.crs.code) ?? null;
      return tryProjectedConversion(detected.easting, detected.northing, projection, detected.crs.name);
    }

    // Fast path: two plain numbers with no DMS indicators AND no cardinal letters.
    // Handles comma-as-decimal-separator ("45,1179 5,4786") which coordinate-parser cannot parse.
    // Strings with cardinals fall through to coordinate-parser, which pairs each cardinal with
    // its adjacent number and handles both "lat S, lng W" and "lng W, lat S" orderings correctly.
    if (!hasDMS && !/[NSEWnsew]/.test(normalized)) {
      if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
        return { lat: a, lng: b, format: 'WGS84' };
      }
    }
  }

  const cleaned = normalized.replace(/[;/]/g, ',').replace(/\s{2,}/g, ' ');

  try {
    const coords = new Coordinates(cleaned);
    const lat = coords.getLatitude();
    const lng = coords.getLongitude();
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, format: hasDMS ? 'DMS' : 'WGS84' };
    }
  } catch {
    return null;
  }

  return null;
};

// --- Formatting for clipboard ---

// Returns a formatted string for the given coordinate system, or null on failure.
export const formatCoordinatesForCopy = (lat, lng, systemCode, projections) => {
  if (systemCode === 'WGS84_DD') {
    return formatWGS84(lat, lng, 4);
  }
  if (systemCode === 'DMS') {
    return `${decimalToDMS(lat, true)}, ${decimalToDMS(lng, false)}`;
  }

  const projection = projections?.find(p => p.code === systemCode);
  if (!projection) return null;

  try {
    const { x, y, zone, hemisphere } = convertWGS84ToProjection(
      lat,
      lng,
      projection
    );
    if (projection.units === 'degrees') {
      return `${x.toFixed(6)}, ${y.toFixed(6)}`;
    }
    const zoneInfo =
      projection.proj === 'utm'
        ? ` (${zone}${hemisphere === 'South' ? 'S' : 'N'})`
        : '';
    return `X: ${Math.round(x)}, Y: ${Math.round(y)}${zoneInfo}`;
  } catch {
    return null;
  }
};
