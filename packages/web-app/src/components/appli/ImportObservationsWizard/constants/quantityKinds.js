// Source of truth: GrottoCenter API database (t_quantity_kind table).
// If the backend adds a new quantity kind, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
export const QUANTITY_KINDS = [
  { id: 1, code: 'Temperature', symbolSi: 'K' },
  { id: 2, code: 'RelativeHumidity', symbolSi: '%' },
  { id: 3, code: 'AtmosphericPressure', symbolSi: 'Pa' },
  { id: 4, code: 'CO2Concentration', symbolSi: 'mol/mol' },
  { id: 5, code: 'WaterLevel', symbolSi: 'm' },
  { id: 6, code: 'WaterFlow', symbolSi: 'm³/s' },
  { id: 7, code: 'Conductivity', symbolSi: 'S/m' },
  { id: 8, code: 'pH', symbolSi: 'pH' },
  { id: 9, code: 'Precipitation', symbolSi: 'm' },
  { id: 10, code: 'DewPointTemperature', symbolSi: 'K' },
  { id: 11, code: 'DissolvedOxygen', symbolSi: 'mg/L' },
  { id: 12, code: 'TotalDissolvedSolids', symbolSi: 'mg/L' },
  { id: 13, code: 'Salinity', symbolSi: 'PSU' },
  { id: 14, code: 'Turbidity', symbolSi: 'NTU' },
  { id: 15, code: 'RedoxPotential', symbolSi: 'V' },
  { id: 16, code: 'Resistivity', symbolSi: 'Ω·m' },
  { id: 17, code: 'Concentration', symbolSi: 'mol/L' },
  { id: 18, code: 'LightIntensity', symbolSi: 'lx' },
  { id: 19, code: 'AirVelocity', symbolSi: 'm/s' },
  { id: 20, code: 'WaterVelocity', symbolSi: 'm/s' },
  { id: 21, code: 'RadonConcentration', symbolSi: 'Bq/m³' },
  { id: 22, code: 'IsotopeDelta', symbolSi: '‰' }
];
