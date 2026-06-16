// Source of truth: GrottoCenter API database (t_unit table).
// If the backend adds a new unit, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
export const UNITS = [
  { id: 1, code: 'degree_celsius', symbol: '°C' },
  { id: 2, code: 'percent', symbol: '%' },
  { id: 3, code: 'hectopascal', symbol: 'hPa' },
  { id: 4, code: 'parts_per_million', symbol: 'ppm' },
  { id: 5, code: 'meter', symbol: 'm' },
  { id: 6, code: 'liter_per_second', symbol: 'L/s' },
  { id: 7, code: 'microsiemens_per_centimeter', symbol: 'µS/cm' },
  { id: 8, code: 'ph_unit', symbol: 'pH' },
  { id: 9, code: 'kelvin', symbol: 'K' },
  { id: 10, code: 'millimeter', symbol: 'mm' },
  { id: 11, code: 'event_count', symbol: 'count' },
  { id: 12, code: 'degree_fahrenheit', symbol: '°F' },
  { id: 13, code: 'millibar', symbol: 'mbar' },
  { id: 14, code: 'pascal', symbol: 'Pa' },
  { id: 15, code: 'kilopascal', symbol: 'kPa' },
  { id: 16, code: 'milligram_per_liter', symbol: 'mg/L' },
  { id: 17, code: 'microgram_per_liter', symbol: 'µg/L' },
  { id: 18, code: 'micromole', symbol: 'µM' },
  { id: 19, code: 'nephelometric_turbidity_unit', symbol: 'NTU' },
  { id: 20, code: 'ohm_centimeter', symbol: 'Ω·cm' },
  { id: 21, code: 'practical_salinity_unit', symbol: 'PSU' },
  { id: 22, code: 'millivolt', symbol: 'mV' },
  { id: 23, code: 'centimeter', symbol: 'cm' },
  { id: 24, code: 'cubic_meter_per_second', symbol: 'm³/s' },
  { id: 25, code: 'lux', symbol: 'lx' },
  { id: 26, code: 'becquerel_per_cubic_meter', symbol: 'Bq/m³' },
  { id: 27, code: 'meter_per_second', symbol: 'm/s' },
  { id: 28, code: 'decibel', symbol: 'dB' },
  { id: 29, code: 'per_mil', symbol: '‰' }
];
