// Lookup data from t_quantity_kind seed
export const QUANTITY_KINDS = [
  { id: 1, code: 'Temperature', symbolSi: 'K', displaySymbol: '°C', siToDisplayFactor: 1, siToDisplayOffset: -273.15 },
  { id: 2, code: 'RelativeHumidity', symbolSi: '%', displaySymbol: '%', siToDisplayFactor: 100, siToDisplayOffset: 0 },
  { id: 3, code: 'AtmosphericPressure', symbolSi: 'Pa', displaySymbol: 'hPa', siToDisplayFactor: 0.01, siToDisplayOffset: 0 },
  { id: 4, code: 'CO2Concentration', symbolSi: 'mol/mol', displaySymbol: 'ppm', siToDisplayFactor: 1000000, siToDisplayOffset: 0 },
  { id: 5, code: 'WaterLevel', symbolSi: 'm', displaySymbol: 'm', siToDisplayFactor: 1, siToDisplayOffset: 0 },
  { id: 6, code: 'WaterFlow', symbolSi: 'm³/s', displaySymbol: 'm³/s', siToDisplayFactor: 1, siToDisplayOffset: 0 },
  { id: 7, code: 'Conductivity', symbolSi: 'S/m', displaySymbol: 'µS/cm', siToDisplayFactor: 10000, siToDisplayOffset: 0 },
  { id: 8, code: 'pH', symbolSi: 'pH', displaySymbol: 'pH', siToDisplayFactor: 1, siToDisplayOffset: 0 },
  { id: 9, code: 'Precipitation', symbolSi: 'm', displaySymbol: 'mm', siToDisplayFactor: 1000, siToDisplayOffset: 0 },
  { id: 10, code: 'DewPointTemperature', symbolSi: 'K', displaySymbol: '°C', siToDisplayFactor: 1, siToDisplayOffset: -273.15 }
];

// Lookup data from t_unit seed
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
  { id: 11, code: 'event_count', symbol: 'count' }
];

// Lookup data from t_medium seed
export const MEDIA = [
  { id: 1, code: 'water' },
  { id: 2, code: 'air' },
  { id: 3, code: 'soil' },
  { id: 4, code: 'sediment' }
];

// Number locale options for decimal separator handling
export const NUMBER_LOCALES = [
  { value: 'en', label: '1,234.56 (dot decimal)', example: '23.5' },
  { value: 'fr', label: '1.234,56 (comma decimal)', example: '23,5' }
];

// File encoding options
export const ENCODINGS = [
  { value: 'UTF-8', label: 'UTF-8' },
  { value: 'ISO-8859-1', label: 'Latin-1 (ISO-8859-1)' },
  { value: 'windows-1252', label: 'Windows-1252' },
  { value: 'UTF-16', label: 'UTF-16' }
];

// Common date format patterns (for 'datetime' timestamp type)
export const DATE_FORMATS = [
  { value: 'yyyy-MM-dd HH:mm:ss', label: '2025-01-15 14:30:00' },
  { value: 'dd/MM/yyyy HH:mm:ss', label: '15/01/2025 14:30:00' },
  { value: 'MM/dd/yyyy HH:mm:ss', label: '01/15/2025 14:30:00' },
  { value: 'yyyy-MM-dd HH:mm', label: '2025-01-15 14:30' },
  { value: 'dd/MM/yyyy HH:mm', label: '15/01/2025 14:30' },
  { value: "yyyy-MM-dd'T'HH:mm:ss", label: '2025-01-15T14:30:00' },
  { value: "yyyy-MM-dd'T'HH:mm:ssXXX", label: '2025-01-15T14:30:00+01:00' },
  { value: 'dd/MM/yyyy', label: '15/01/2025' },
  { value: 'yyyy-MM-dd', label: '2025-01-15' }
];

// Date-only formats (for 'date' timestamp type)
export const DATE_ONLY_FORMATS = [
  { value: 'yyyy-MM-dd', label: '2025-01-15' },
  { value: 'dd/MM/yyyy', label: '15/01/2025' },
  { value: 'MM/dd/yyyy', label: '01/15/2025' },
  { value: 'yy/MM/dd', label: '25/01/15' },
  { value: 'dd/MM/yy', label: '15/01/25' },
  { value: 'yyyy/MM/dd', label: '2025/01/15' },
  { value: 'dd-MM-yyyy', label: '15-01-2025' },
  { value: 'yyyyMMdd', label: '20250115' }
];

// Time-only formats (for 'time' timestamp type)
export const TIME_ONLY_FORMATS = [
  { value: 'HH:mm:ss', label: '14:30:00' },
  { value: 'HH:mm', label: '14:30' },
  { value: 'H:mm:ss', label: '9:30:00' },
  { value: 'H:mm', label: '9:30' },
  { value: 'HH:mm:ss.SSS', label: '14:30:00.000' },
  { value: 'HHmmss', label: '143000' }
];

// Wizard step IDs
export const STEPS = {
  UPLOAD: 0,
  MAPPING: 1,
  VALIDATION: 2,
  DOWNLOAD: 3
};

// Column roles
export const COLUMN_ROLES = {
  TIMESTAMP: 'timestamp',
  MEASUREMENT: 'measurement',
  DECIMAL_PART: 'decimal_part',
  EXCLUDED: 'excluded'
};

// Timestamp sub-types: what kind of time value does this column hold?
export const TIMESTAMP_TYPES = [
  { value: 'datetime', label: 'Full datetime' },
  { value: 'date', label: 'Date only' },
  { value: 'time', label: 'Time only' },
  { value: 'elapsed_seconds', label: 'Elapsed seconds' },
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'day', label: 'Day' },
  { value: 'hour', label: 'Hour' },
  { value: 'minute', label: 'Minute' },
  { value: 'second', label: 'Second' }
];

// Map quantity kind IDs to their compatible unit IDs
export const QUANTITY_UNIT_MAP = {
  1: [1, 9],       // Temperature → °C, K
  2: [2],          // RelativeHumidity → %
  3: [3],          // AtmosphericPressure → hPa
  4: [4],          // CO2Concentration → ppm
  5: [5, 10],      // WaterLevel → m, mm
  6: [6],          // WaterFlow → L/s
  7: [7],          // Conductivity → µS/cm
  8: [8],          // pH → pH
  9: [10, 11],     // Precipitation → mm, count
  10: [1, 9]       // DewPointTemperature → °C, K
};

// Map quantity kind IDs to their default medium ID
export const QUANTITY_MEDIUM_MAP = {
  1: 2,   // Temperature → air
  2: 2,   // RelativeHumidity → air
  3: 2,   // AtmosphericPressure → air
  4: 2,   // CO2Concentration → air
  5: 1,   // WaterLevel → water
  6: 1,   // WaterFlow → water
  7: 1,   // Conductivity → water
  8: 1,   // pH → water
  9: 1,   // Precipitation → water
  10: 2   // DewPointTemperature → air
};

// All IANA timezones with UTC offsets, sorted by offset
export const TIMEZONES = (() => {
  const zones = Intl.supportedValuesOf('timeZone');
  const now = Date.now();
  const fmt = tz => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset'
      }).formatToParts(now);
      const offsetPart = parts.find(p => p.type === 'timeZoneName');
      return offsetPart ? offsetPart.value : '';
    } catch (e) {
      return '';
    }
  };

  return zones
    .map(tz => {
      const offset = fmt(tz);
      // Parse offset like "GMT+2", "GMT-5:30", "GMT" into minutes
      let offsetMinutes = 0;
      if (offset && offset !== 'GMT') {
        const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
        if (match) {
          const sign = match[1] === '+' ? 1 : -1;
          const hours = parseInt(match[2], 10);
          const mins = match[3] ? parseInt(match[3], 10) : 0;
          offsetMinutes = sign * (hours * 60 + mins);
        }
      }
      const utcLabel = offsetMinutes === 0
        ? 'UTC'
        : `UTC${offsetMinutes > 0 ? '+' : ''}${Math.floor(offsetMinutes / 60)}${offsetMinutes % 60 ? `:${String(Math.abs(offsetMinutes % 60)).padStart(2, '0')}` : ''}`;
      return {
        value: tz,
        label: `${tz} (${utcLabel})`,
        offsetMinutes
      };
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.value.localeCompare(b.value));
})();
