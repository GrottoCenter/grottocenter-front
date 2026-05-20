import proj4 from 'proj4';

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

// Accepts DMS: "48°31'24.2"N", "48 31 24.2 N", "48d31m24.2sN"
// Accepts DDM: "48°31.402'N"
// Returns NaN for plain decimals — callers handle the WGS84 decimal case separately.
export const parseDMS = str => {
  if (!str) return NaN;
  const cleaned = str.trim();
  const dmsMatch = cleaned.match(
    /^(-?)(\d+)\s*[°d]\s*(\d+)\s*[m']\s*(\d+(?:[.,]\d+)?)\s*[s"]?\s*([NSEWnsew])?$/
  );
  if (dmsMatch) {
    const [, sign, d, m, s, dir] = dmsMatch;
    let decimal = +d + +m / 60 + parseFloat(s.replace(',', '.')) / 3600;
    if (sign === '-' || (dir && /^[SWsw]$/.test(dir))) decimal = -decimal;
    return decimal;
  }
  // DDM: "48°31.402'N" — degrees + decimal minutes
  const ddmMatch = cleaned.match(
    /^(-?)(\d+)\s*[°d]\s*(\d+(?:[.,]\d+)?)\s*[m']\s*([NSEWnsew])?$/
  );
  if (ddmMatch) {
    const [, sign, d, m, dir] = ddmMatch;
    let decimal = +d + parseFloat(m.replace(',', '.')) / 60;
    if (sign === '-' || (dir && /^[SWsw]$/.test(dir))) decimal = -decimal;
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
