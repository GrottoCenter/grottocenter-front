// Source of truth: GrottoCenter API database (quantity_kind ↔ unit relationships).
// If the backend adds a new mapping, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
// Maps each quantity kind ID to an array of compatible unit IDs
export const QUANTITY_KIND_UNITS_MAP = {
  1: [1, 12, 9], // Temperature → °C, °F, K
  2: [2], // RelativeHumidity → %
  3: [3, 13, 14, 15], // AtmosphericPressure → hPa, mbar, Pa, kPa
  4: [4, 2], // CO2Concentration → ppm, %
  5: [5, 23, 10], // WaterLevel → m, cm, mm
  6: [6, 24], // WaterFlow → L/s, m³/s
  7: [7], // Conductivity → µS/cm
  8: [8], // pH → pH
  9: [10, 11], // Precipitation → mm, count
  10: [1, 12, 9], // DewPointTemperature → °C, °F, K
  11: [16], // DissolvedOxygen → mg/L
  12: [16, 17], // TotalDissolvedSolids → mg/L, µg/L
  13: [21], // Salinity → PSU
  14: [19], // Turbidity → NTU
  15: [22], // RedoxPotential → mV
  16: [20], // Resistivity → Ω·cm
  17: [16, 18], // NitrateConcentration → mg/L, µM
  18: [16, 18], // NitriteConcentration → mg/L, µM
  19: [16, 18], // AmmoniumConcentration → mg/L, µM
  20: [16, 18], // PhosphateConcentration → mg/L, µM
  21: [16, 18], // SilicateConcentration → mg/L, µM
  22: [25], // LightIntensity → lx
  23: [27], // AirVelocity → m/s
  24: [27], // WaterVelocity → m/s
  25: [26], // RadonConcentration → Bq/m³
  26: [29] // IsotopeDelta → ‰
};
