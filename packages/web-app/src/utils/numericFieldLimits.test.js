import {
  NUMERIC_FIELD_LIMITS,
  getDiscoveryYearLimits,
  validateNumericRange
} from './numericFieldLimits';

const formatMessage = ({ id }, values) => ({ id, ...values });

describe('numeric field limits', () => {
  it.each(Object.entries(NUMERIC_FIELD_LIMITS))(
    'accepts the exact %s boundaries and rejects their neighbours',
    (_name, { min, max }) => {
      expect(validateNumericRange(min, min, max, formatMessage)).toBe(true);
      expect(validateNumericRange(String(max), min, max, formatMessage)).toBe(
        true
      );
      [min - 1, max + 1].forEach(value => {
        expect(validateNumericRange(value, min, max, formatMessage)).toEqual({
          id: 'form.numericRange',
          min,
          max
        });
      });
    }
  );

  it.each(['', null, undefined])(
    'accepts an empty optional value %s',
    value => {
      expect(validateNumericRange(value, 0, 20000, formatMessage)).toBe(true);
    }
  );

  it.each([1.5, '1.5', NaN, Infinity, -Infinity, 'invalid'])(
    'rejects a non-finite or non-integer value %s',
    value => {
      expect(validateNumericRange(value, 0, 20000, formatMessage)).toEqual({
        id: 'form.integerRequired'
      });
    }
  );

  it('computes discovery year limits from the current year', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-06-01T12:00:00Z'));
      const { min, max } = getDiscoveryYearLimits();
      expect({ min, max }).toEqual({ min: -9999, max: 2030 });
      expect(validateNumericRange(min, min, max, formatMessage)).toBe(true);
      expect(validateNumericRange(max, min, max, formatMessage)).toBe(true);
      expect(validateNumericRange(2031, min, max, formatMessage)).toEqual({
        id: 'form.numericRange',
        min,
        max
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
