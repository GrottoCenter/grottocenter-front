export const validateLatitude = (value, formatMessage) => {
  if (value > 90 || value < -90) {
    return formatMessage({ id: 'Latitude must be between -90 and 90' });
  }
  return true;
};

export const validateLongitude = (value, formatMessage) => {
  if (value > 180 || value < -180) {
    return formatMessage({ id: 'Longitude must be between -180 and 180' });
  }
  return true;
};
