// Source of truth: Grottocenter API database (t_quantity_kind table).
// If the backend adds a new quantity kind, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
export const QUANTITY_KINDS = [
  { id: 1, code: 'Temperature', symbolSi: 'K' },
  { id: 2, code: 'RelativeHumidity', symbolSi: '%' },
  { id: 3, code: 'AtmosphericPressure', symbolSi: 'Pa' },
  { id: 4, code: 'WaterLevel', symbolSi: 'm' },
  { id: 5, code: 'WaterFlow', symbolSi: 'm³/s' },
  { id: 6, code: 'Conductivity', symbolSi: 'S/m' },
  { id: 7, code: 'pH', symbolSi: 'pH' },
  { id: 8, code: 'Precipitation', symbolSi: 'm' },
  { id: 9, code: 'DewPointTemperature', symbolSi: 'K' },
  { id: 10, code: 'Salinity', symbolSi: 'PSU' },
  { id: 11, code: 'Turbidity', symbolSi: 'NTU' },
  { id: 12, code: 'RedoxPotential', symbolSi: 'V' },
  { id: 13, code: 'Resistivity', symbolSi: 'Ω·m' },
  { id: 14, code: 'Concentration', symbolSi: 'mol/L' },
  { id: 15, code: 'LightIntensity', symbolSi: 'lx' },
  { id: 16, code: 'AirVelocity', symbolSi: 'm/s' },
  { id: 17, code: 'WaterVelocity', symbolSi: 'm/s' },
  { id: 18, code: 'IsotopeDelta', symbolSi: '‰' }
];
