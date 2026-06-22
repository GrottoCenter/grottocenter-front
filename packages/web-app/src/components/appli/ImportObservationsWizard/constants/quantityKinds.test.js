import { QUANTITY_KINDS } from './quantityKinds';

describe('QUANTITY_KINDS', () => {
  it('has exactly 18 entries', () => {
    expect(QUANTITY_KINDS).toHaveLength(18);
  });

  describe('all entries match expected values', () => {
    const expected = [
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

    it.each(expected)(
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
      'SilicateConcentration',
      'CO2Concentration',
      'DissolvedOxygen',
      'TotalDissolvedSolids',
      'RadonConcentration'
    ];

    it.each(removedCodes)('%s is not present', code => {
      const entry = QUANTITY_KINDS.find(qk => qk.code === code);
      expect(entry).toBeUndefined();
    });
  });
});
