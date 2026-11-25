export const MAX_MAP_EXPORT_ROWS = 10000;

// Export serialization can round coordinates just beyond a viewport edge.
// API serializers have no fixed decimal precision; allow five-decimal rounding.
const MAP_EXPORT_BOUNDS_TOLERANCE = 1e-5;

const mapExportError = code => Object.assign(new Error(code), { code });

// Capture plain values, never the live Leaflet map: GPS follow and compass
// rotation can continue behind the dialog without changing this selection.
export const captureMapExportSelection = map => {
  const bounds = map.getBounds();
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  };
};

export const getMapExportBounds = selection => {
  const { west, east } = selection;
  const south = Math.max(-90, selection.south);
  const north = Math.min(90, selection.north);
  if (
    !Object.values(selection).every(Number.isFinite) ||
    east <= west ||
    north <= south
  ) {
    throw mapExportError('mapExport.error');
  }
  // Preserve normal bounds exactly: modulo arithmetic introduces rounding
  // errors that can otherwise exclude entrances on the viewport edge.
  const wrappedWest =
    west >= -180 && west < 180
      ? west
      : ((((west + 180) % 360) + 360) % 360) - 180;
  const wrappedEast = wrappedWest === west ? east : wrappedWest + east - west;
  const box = (swLng, neLng) => ({
    sw_lat: south,
    sw_lng: swLng,
    ne_lat: north,
    ne_lng: neLng
  });
  if (east - west >= 360) return [box(-180, 180)];
  return wrappedEast <= 180
    ? [box(wrappedWest, wrappedEast)]
    : [box(wrappedWest, 180), box(-180, wrappedEast - 360)];
};

const hasCoordinates = entrance =>
  Number.isFinite(entrance.latitude) &&
  Number.isFinite(entrance.longitude) &&
  Math.abs(entrance.latitude) <= 90 &&
  Math.abs(entrance.longitude) <= 180;

export const makeMapExportSearch = bounds => ({
  entity: 'entrances',
  query: '*',
  matchAllFields: true,
  filter: {
    latitude: [bounds.sw_lat, bounds.ne_lat],
    longitude: [bounds.sw_lng, bounds.ne_lng],
    isSensitive: false
  }
});

const readLinkedId = link => {
  try {
    const url = new URL(link);
    return /^\/ui\/entrances\/(\d+)\/?$/.exec(url.pathname)?.[1] ?? null;
  } catch {
    return null;
  }
};

// The API streams exports. A response can start with HTTP 200 and then fail;
// parse the complete document before downloading it. Without a separate count
// request this cannot detect a syntactically valid but truncated server export.
const parseMapExportBlob = async (blob, format, bounds) => {
  const text = await blob.text();
  let points;
  let document;
  let elements;
  try {
    if (format === 'geojson') {
      const data = JSON.parse(text);
      document = data;
      elements = data.features;
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features))
        throw new Error('Invalid GeoJSON');
      points = data.features.map(feature => {
        if (feature.type !== 'Feature' || feature.geometry?.type !== 'Point')
          throw new Error('Invalid point');
        return {
          id: readLinkedId(feature.properties?.grottocenterUrl),
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
          name: feature.properties?.name
        };
      });
    } else {
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      document = xml;
      const root = format === 'gpx' ? 'gpx' : 'kml';
      if (
        !['gpx', 'kml'].includes(format) ||
        xml.querySelector('parsererror') ||
        xml.documentElement.localName !== root
      )
        throw new Error('Invalid XML');
      elements = Array.from(
        xml.getElementsByTagNameNS('*', format === 'gpx' ? 'wpt' : 'Placemark')
      );
      points = elements.map(element => {
        const get = tag =>
          element.getElementsByTagNameNS('*', tag)[0]?.textContent;
        if (format === 'gpx') {
          const longitude = element.getAttribute('lon');
          const latitude = element.getAttribute('lat');
          return {
            id: readLinkedId(
              element.querySelector('link')?.getAttribute('href')
            ),
            longitude: Number(longitude?.trim() ? longitude : NaN),
            latitude: Number(latitude?.trim() ? latitude : NaN),
            name: get('name')
          };
        }
        const coordinates =
          get('coordinates')
            ?.split(',')
            .map(value => (value.trim() ? Number(value) : NaN)) ?? [];
        return {
          id: readLinkedId(
            element.querySelector('Data[name="grottocenterUrl"] value')
              ?.textContent
          ),
          longitude: coordinates[0],
          latitude: coordinates[1],
          name: get('name')
        };
      });
    }
  } catch {
    throw mapExportError('mapExport.invalidFile');
  }
  const isValid = points.every(
    point =>
      point.id &&
      hasCoordinates(point) &&
      (point.name == null || typeof point.name === 'string') &&
      point.latitude >= bounds.sw_lat - MAP_EXPORT_BOUNDS_TOLERANCE &&
      point.latitude <= bounds.ne_lat + MAP_EXPORT_BOUNDS_TOLERANCE &&
      point.longitude >= bounds.sw_lng - MAP_EXPORT_BOUNDS_TOLERANCE &&
      point.longitude <= bounds.ne_lng + MAP_EXPORT_BOUNDS_TOLERANCE
  );
  if (!isValid) throw mapExportError('mapExport.invalidFile');
  return { document, elements, points };
};

// A viewport crossing the antimeridian needs two small range queries. Combine
// their server-generated records into one file, with one overall export cap.
export const prepareMapExportBlob = async (blobs, format, bounds) => {
  const parsed = await Promise.all(
    blobs.map((blob, index) => parseMapExportBlob(blob, format, bounds[index]))
  );
  const points = parsed.flatMap(result => result.points);
  if (!points.length) throw mapExportError('mapExport.empty');
  if (points.length > MAX_MAP_EXPORT_ROWS)
    throw mapExportError('mapExport.tooMany');
  if (new Set(points.map(point => point.id)).size !== points.length)
    throw mapExportError('mapExport.invalidFile');
  if (blobs.length === 1) return blobs[0];
  const first = parsed[0].document;
  if (format === 'geojson') {
    first.features = parsed.flatMap(result => result.elements);
    return new Blob([JSON.stringify(first)], { type: 'application/geo+json' });
  }
  const target =
    format === 'gpx'
      ? first.documentElement
      : first.getElementsByTagNameNS('*', 'Document')[0];
  if (!target) throw mapExportError('mapExport.invalidFile');
  parsed.slice(1).forEach(result =>
    result.elements.forEach(element => {
      target.appendChild(first.importNode(element, true));
    })
  );
  return new Blob([new XMLSerializer().serializeToString(first)], {
    type:
      format === 'gpx'
        ? 'application/gpx+xml'
        : 'application/vnd.google-earth.kml+xml'
  });
};
