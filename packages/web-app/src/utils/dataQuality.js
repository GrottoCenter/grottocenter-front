export const DATA_QUALITY_THRESHOLDS = {
  GOOD: 70,
  SATISFACTORY: 40
};

export const DATA_QUALITY_LEVELS = {
  GOOD: 'good',
  SATISFACTORY: 'satisfactory',
  INSUFFICIENT: 'insufficient'
};

// Matches MUI v7 default theme.palette.success/warning/error.main
export const DATA_QUALITY_COLORS = {
  [DATA_QUALITY_LEVELS.GOOD]: '#2e7d32',
  [DATA_QUALITY_LEVELS.SATISFACTORY]: '#ed6c02',
  [DATA_QUALITY_LEVELS.INSUFFICIENT]: '#d32f2f'
};

export const DATA_QUALITY_TRACK_COLOR = '#e0e0e0';

export const DATA_QUALITY_LABEL_KEYS = {
  [DATA_QUALITY_LEVELS.GOOD]: 'Good quality',
  [DATA_QUALITY_LEVELS.SATISFACTORY]: 'Satisfactory quality',
  [DATA_QUALITY_LEVELS.INSUFFICIENT]: 'Insufficient quality'
};

// Single threshold comparison — used by all derived helpers below.
export const getDataQualityLevel = value => {
  if (value >= DATA_QUALITY_THRESHOLDS.GOOD) return DATA_QUALITY_LEVELS.GOOD;
  if (value >= DATA_QUALITY_THRESHOLDS.SATISFACTORY)
    return DATA_QUALITY_LEVELS.SATISFACTORY;
  // Data quality == null is handled as insufficient
  return DATA_QUALITY_LEVELS.INSUFFICIENT;
};

export const getDataQualityColor = value =>
  DATA_QUALITY_COLORS[getDataQualityLevel(value)];

// i18n key for a standalone label (no surrounding section title)
export const getDataQualityLabelKey = value =>
  DATA_QUALITY_LABEL_KEYS[getDataQualityLevel(value)];

// Normalises both shapes returned by different API endpoints:
//   - geoloc endpoint: dataQuality is a plain number
//   - detail endpoint: dataQuality is { total, categories }
export const getDataQualityValue = dataQuality => {
  if (dataQuality == null) return null;
  if (typeof dataQuality === 'number') return dataQuality;
  return dataQuality.total ?? null;
};
