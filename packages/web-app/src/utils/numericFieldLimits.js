export const NUMERIC_FIELD_LIMITS = {
  ALTITUDE: { min: -9999, max: 9999 },
  DEPTH: { min: 0, max: 20000 },
  DEVELOPMENT: { min: 0, max: 100000000 }
};

export const getDiscoveryYearLimits = () => ({
  min: -9999,
  max: new Date().getFullYear()
});

export const validateNumericRange = (value, min, max, formatMessage) => {
  if (value === '' || value === null || value === undefined) return true;
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    return formatMessage({ id: 'form.integerRequired' });
  }
  if (number < min || number > max) {
    return formatMessage({ id: 'form.numericRange' }, { min, max });
  }
  return true;
};
