import {
  SUBSTANCE_REQUIRING_CODES,
  isSubstanceRequired
} from './substanceUtils';

describe('substanceUtils', () => {
  describe('SUBSTANCE_REQUIRING_CODES', () => {
    it('contains Concentration and IsotopeDelta', () => {
      expect(SUBSTANCE_REQUIRING_CODES).toContain('Concentration');
      expect(SUBSTANCE_REQUIRING_CODES).toContain('IsotopeDelta');
    });

    it('contains exactly 2 entries', () => {
      expect(SUBSTANCE_REQUIRING_CODES).toHaveLength(2);
    });
  });

  describe('isSubstanceRequired', () => {
    it('returns true for Concentration', () => {
      expect(isSubstanceRequired('Concentration')).toBe(true);
    });

    it('returns true for IsotopeDelta', () => {
      expect(isSubstanceRequired('IsotopeDelta')).toBe(true);
    });

    it('returns false for Temperature', () => {
      expect(isSubstanceRequired('Temperature')).toBe(false);
    });

    it('returns false for pH', () => {
      expect(isSubstanceRequired('pH')).toBe(false);
    });

    it('returns false for WaterLevel', () => {
      expect(isSubstanceRequired('WaterLevel')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isSubstanceRequired('')).toBe(false);
    });
  });
});
