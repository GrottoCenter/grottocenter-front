import { DEFAULT_DOCUMENT_LANGUAGE } from '../constants/defaults';

// Profiles written before multi-author support carry a single `authorId`.
const normalizeAuthorIds = json => {
  if (Array.isArray(json.authorIds) && json.authorIds.length > 0) {
    return json.authorIds;
  }
  return json.authorId != null ? [json.authorId] : [];
};

/**
 * Serialises the current wizard state to the Profile JSON format.
 * Conforms to the observation-import-profile-contract.md API contract.
 *
 * @param {object} state - The wizard Redux state
 * @returns {object} profileJson
 */
export const exportProfile = state => {
  const { columnMappings = [], context = {} } = state;

  // Extract timezone from the first timestamp column mapping that has one
  const timestampMapping = columnMappings.find(
    m => m.role === 'timestamp' && m.timezone
  );
  const timezone = timestampMapping ? timestampMapping.timezone : null;

  // Extract dateFormat from datetime column mapping
  const datetimeMapping = columnMappings.find(
    m => m.role === 'timestamp' && m.timestampType === 'datetime'
  );
  const dateFormat = datetimeMapping
    ? datetimeMapping.dateFormat || null
    : null;

  // Extract dateOnlyFormat from dateOnly column mapping
  const dateOnlyMapping = columnMappings.find(
    m => m.role === 'timestamp' && m.timestampType === 'dateOnly'
  );
  const dateOnlyFormat = dateOnlyMapping
    ? dateOnlyMapping.dateFormat || null
    : null;

  // Extract timeOnlyFormat from timeOnly column mapping
  const timeOnlyMapping = columnMappings.find(
    m => m.role === 'timestamp' && m.timestampType === 'timeOnly'
  );
  const timeOnlyFormat = timeOnlyMapping
    ? timeOnlyMapping.timeFormat || null
    : null;

  // Build columnMappings array for the profile (API reads formats from root, not per-column)
  const profileColumnMappings = columnMappings.map(m => {
    const entry = { columnIndex: m.columnIndex, role: m.role };
    if (m.role === 'timestamp') {
      entry.timestampType = m.timestampType;
    }
    if (m.role === 'measurement') {
      entry.sensorConfigurationId = m.sensorConfigurationId;
      entry.mediumId = m.mediumId;
    }
    return entry;
  });

  const profile = {
    encoding: state.encoding,
    headerRow: state.headerRow >= 0 ? state.headerRow + 1 : null, // API expects 1-based; null = no header
    skipFirstRows: state.skipFirstRows,
    skipLastRows: state.skipLastRows,
    numberLocale: state.numberLocale,
    timezone,
    dateFormat,
    dateOnlyFormat,
    timeOnlyFormat,
    columnMappings: profileColumnMappings,
    deviceId: state.confirmedDevice ? state.confirmedDevice.id : null,
    caveId: context.caveId != null ? Number(context.caveId) : null,
    locationMode: context.locationMode || 'pointAndCave',
    pointLabel: context.pointLabel,
    latitude:
      context.latitude != null &&
      context.latitude !== '' &&
      !Number.isNaN(Number(context.latitude))
        ? Number(context.latitude)
        : null,
    longitude:
      context.longitude != null &&
      context.longitude !== '' &&
      !Number.isNaN(Number(context.longitude))
        ? Number(context.longitude)
        : null,
    authorIds: Array.isArray(context.authorIds)
      ? context.authorIds.map(Number)
      : [],
    licenseId: context.licenseId,
    documentTitle: context.documentTitle,
    documentLanguage: state.documentLanguage,
    observationName: context.observationName,
    dataQuality: context.dataQuality
  };

  // Only include samplingIntervalSeconds when it has a value
  if (
    state.samplingIntervalSeconds !== null &&
    state.samplingIntervalSeconds !== undefined
  ) {
    profile.samplingIntervalSeconds = state.samplingIntervalSeconds;
  }

  return profile;
};

/**
 * Parses a profile JSON and returns a partial WizardState.
 * Unknown keys are silently ignored.
 *
 * @param {object} json - The parsed JSON object
 * @returns {{ ok: true, state: object } | { ok: false, error: string }}
 */
export const importProfile = json => {
  try {
    if (json === null || json === undefined || typeof json !== 'object') {
      return { ok: false, error: 'Invalid JSON' };
    }

    if (Array.isArray(json)) {
      return { ok: false, error: 'Invalid JSON' };
    }

    // Restore per-column format fields from root-level formats for internal use
    const columnMappings = (json.columnMappings || []).map(m => {
      const entry = { ...m };
      if (m.role === 'timestamp') {
        if (m.timestampType === 'datetime' && json.dateFormat) {
          entry.dateFormat = json.dateFormat;
        }
        if (m.timestampType === 'dateOnly' && json.dateOnlyFormat) {
          entry.dateFormat = json.dateOnlyFormat;
        }
        if (m.timestampType === 'timeOnly' && json.timeOnlyFormat) {
          entry.timeFormat = json.timeOnlyFormat;
        }
        if (json.timezone) {
          entry.timezone = json.timezone;
        }
      }
      return entry;
    });

    const state = {
      encoding: json.encoding,
      headerRow: json.headerRow != null ? json.headerRow - 1 : -1, // Convert 1-based to 0-based; null = no header (-1)
      skipFirstRows: json.skipFirstRows,
      skipLastRows: json.skipLastRows,
      numberLocale: json.numberLocale,
      documentLanguage: json.documentLanguage || DEFAULT_DOCUMENT_LANGUAGE,
      columnMappings,
      deviceId:
        json.deviceId != null
          ? json.deviceId
          : (json.confirmedDevice && json.confirmedDevice.id) || null,
      context: {
        locationMode: json.locationMode || 'pointAndCave',
        caveId: json.caveId,
        pointLabel: json.pointLabel,
        latitude: json.latitude,
        longitude: json.longitude,
        authorIds: normalizeAuthorIds(json),
        licenseId: json.licenseId,
        documentTitle: json.documentTitle,
        observationName: json.observationName,
        dataQuality: json.dataQuality
      }
    };

    // Only include samplingIntervalSeconds when present in the JSON
    if (
      json.samplingIntervalSeconds !== null &&
      json.samplingIntervalSeconds !== undefined
    ) {
      state.samplingIntervalSeconds = json.samplingIntervalSeconds;
    }

    return { ok: true, state };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
};

/**
 * Derives a safe file name from the point label.
 * Strips characters outside word characters, hyphens, and underscores,
 * transliterating common accented Latin chars first.
 *
 * @param {string} pointLabel
 * @returns {string} e.g. "SalleDesEchos_profile.json"
 */
export const deriveProfileFileName = pointLabel => {
  const transliterated = (pointLabel || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const sanitized = transliterated.replace(/[^A-Za-z0-9\-_]/g, '');
  return `${sanitized}_profile.json`;
};
