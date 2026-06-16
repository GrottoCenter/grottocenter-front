import { QUANTITY_KINDS } from './quantityKinds';

describe('QUANTITY_KINDS', () => {
  it('has exactly 22 entries', () => {
    expect(QUANTITY_KINDS).toHaveLength(22);
  });

  describe('ids 1–16 are unchanged', () => {
    const expectedFirstSixteen = [
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
      { id: 16, code: 'Resistivity', symbolSi: 'Ω·m' }
    ];

    it.each(expectedFirstSixteen)(
      'id $id is $code with symbolSi $symbolSi',
      ({ id, code, symbolSi }) => {
        const entry = QUANTITY_KINDS.find(qk => qk.id === id);
        expect(entry).toBeDefined();
        expect(entry.code).toBe(code);
        expect(entry.symbolSi).toBe(symbolSi);
      }
    );
  });

  describe('id 17 is Concentration', () => {
    it('has code Concentration and symbolSi mol/L', () => {
      const entry = QUANTITY_KINDS.find(qk => qk.id === 17);
      expect(entry).toBeDefined();
      expect(entry.code).toBe('Concentration');
      expect(entry.symbolSi).toBe('mol/L');
    });
  });

  describe('ids 18–22 are renumbered correctly', () => {
    const expectedRenumbered = [
      { id: 18, code: 'LightIntensity', symbolSi: 'lx' },
      { id: 19, code: 'AirVelocity', symbolSi: 'm/s' },
      { id: 20, code: 'WaterVelocity', symbolSi: 'm/s' },
      { id: 21, code: 'RadonConcentration', symbolSi: 'Bq/m³' },
      { id: 22, code: 'IsotopeDelta', symbolSi: '‰' }
    ];

    it.each(expectedRenumbered)(
      'id $id is $code with symbolSi $symbolSi',
      ({ id, code, symbolSi }) => {
        const entry = QUANTITY_KINDS.find(qk => qk.id === id);
        expect(entry).toBeDefined();
        expect(entry.code).toBe(code);
        expect(entry.symbolSi).toBe(symbolSi);
      }
    );
  });

  describe('removed codes do not exist', () => {
    const removedCodes = [
      'NitrateConcentration',
      'NitriteConcentration',
      'AmmoniumConcentration',
      'PhosphateConcentration',
      'SilicateConcentration'
    ];

    it.each(removedCodes)('%s is not present', code => {
      const entry = QUANTITY_KINDS.find(qk => qk.code === code);
      expect(entry).toBeUndefined();
    });
  });
});
