/**
 * Supported export formats for search results.
 * Each entry defines the value sent to the API and the display label.
 */
const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'gpx', label: 'GPX' },
  { value: 'kml', label: 'KML' }
];

/**
 * Set of valid format values, derived from EXPORT_FORMATS.
 * Used for input validation with csv as fallback for unknown values.
 */
const VALID_EXPORT_FORMATS = new Set(EXPORT_FORMATS.map(f => f.value));

export { EXPORT_FORMATS, VALID_EXPORT_FORMATS };
