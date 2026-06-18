// Source of truth: GrottoCenter API database (quantity_kind ↔ unit relationships).
// If the backend adds a new mapping, this file must be updated manually.
// TODO: Consider fetching these from an API endpoint to avoid drift.
// Maps each quantity kind ID to an array of compatible unit IDs
export const QUANTITY_KIND_UNITS_MAP = {
  1: [1, 12, 9], // Temperature → °C, °F, K
  2: [2], // RelativeHumidity → %
  3: [3, 13, 14, 15], // AtmosphericPressure → hPa, mbar, Pa, kPa
  4: [5, 23, 10], // WaterLevel → m, cm, mm
  5: [6, 24], // WaterFlow → L/s, m³/s
  6: [7], // Conductivity → µS/cm
  7: [8], // pH → pH
  8: [10, 11], // Precipitation → mm, count
  9: [1, 12, 9], // DewPointTemperature → °C, °F, K
  10: [21], // Salinity → PSU
  11: [19], // Turbidity → NTU
  12: [22], // RedoxPotential → mV
  13: [20], // Resistivity → Ω·cm
  14: [16, 17, 18, 4, 2, 26], // Concentration → mg/L, µg/L, µM, ppm, %, Bq/m³
  15: [25], // LightIntensity → lx
  16: [27], // AirVelocity → m/s
  17: [27], // WaterVelocity → m/s
  18: [29] // IsotopeDelta → ‰
};
