export const DATA_QUALITY_THRESHOLDS = {
  GOOD: 70,
  SATISFACTORY: 40
};

// Matches MUI v7 default theme.palette.success/warning/error.main
export const DATA_QUALITY_COLORS = {
  good: '#2e7d32',
  satisfactory: '#ed6c02',
  insufficient: '#d32f2f'
};

export const DATA_QUALITY_TRACK_COLOR = '#e0e0e0';

export const getDataQualityColor = value => {
  if (value >= DATA_QUALITY_THRESHOLDS.GOOD) return DATA_QUALITY_COLORS.good;
  if (value >= DATA_QUALITY_THRESHOLDS.SATISFACTORY)
    return DATA_QUALITY_COLORS.satisfactory;
  return DATA_QUALITY_COLORS.insufficient;
};

// i18n key for a standalone label (no surrounding section title)
export const getDataQualityLabelKey = value => {
  if (value >= DATA_QUALITY_THRESHOLDS.GOOD) return 'Good quality';
  if (value >= DATA_QUALITY_THRESHOLDS.SATISFACTORY) return 'Satisfactory quality';
  return 'Insufficient quality';
};

// Normalises both shapes returned by different API endpoints:
//   - geoloc endpoint: dataQuality is a plain number
//   - detail endpoint: dataQuality is { total, categories }
export const getDataQualityValue = dataQuality => {
  if (dataQuality == null) return null;
  if (typeof dataQuality === 'number') return dataQuality;
  return dataQuality.total ?? null;
};
