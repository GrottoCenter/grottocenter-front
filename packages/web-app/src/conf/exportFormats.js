const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'gpx', label: 'GPX' },
  { value: 'kml', label: 'KML' }
];

const VALID_EXPORT_FORMATS = new Set(EXPORT_FORMATS.map(f => f.value));

export { EXPORT_FORMATS, VALID_EXPORT_FORMATS };
