import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import {
  UPDATE_COLUMN_MAPPING,
  SET_COLUMN_MAPPINGS
} from '../../../../actions/Observations/importWizard';
import { MEDIUMS } from '../constants/mediums';
import TimestampFormatInput from './TimestampFormatInput';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = ['timestamp', 'measurement', 'decimal_part', 'excluded'];

const TIMESTAMP_TYPES = [
  'datetime',
  'dateOnly',
  'timeOnly',
  'elapsed_seconds',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second'
];

// Sequence used by auto-selection to suggest the next logical timestamp type.
// elapsed_seconds is the terminal fallback — once reached, it repeats.
const TIMESTAMP_TYPE_SEQUENCE = [
  'datetime',
  'dateOnly',
  'timeOnly',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'elapsed_seconds'
];

const PREVIEW_COUNT = 10;

// Types the pill builder can edit directly; everything else falls back to
// the full datetime builder.
const PILL_BUILDER_TYPES = ['datetime', 'dateOnly', 'timeOnly'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getIanaTimezones = () => {
  try {
    if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
      const zones = Intl.supportedValuesOf('timeZone');
      // Ensure UTC is always present (some runtimes omit it)
      if (!zones.includes('UTC')) zones.unshift('UTC');
      return zones;
    }
  } catch {
    // fallback
  }
  return ['UTC', 'Europe/Paris', 'America/New_York', 'Asia/Tokyo'];
};

const getTimezoneOffset = tz => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart) {
      const match = tzPart.value.match(/GMT([+-]\d+)?/);
      if (match) {
        return match[1] ? parseInt(match[1], 10) : 0;
      }
    }
  } catch {
    // fallback
  }
  return 0;
};

const sortedTimezones = (() => {
  const zones = getIanaTimezones();
  return zones
    .map(tz => ({ tz, offset: getTimezoneOffset(tz) }))
    .sort((a, b) => a.offset - b.offset)
    .map(item => item.tz);
})();

/**
 * Formats a timezone label with UTC offset, e.g. "Europe/Paris (UTC+1)"
 */
const formatTimezoneLabel = tz => {
  if (!tz) return '';
  const offset = getTimezoneOffset(tz);
  if (offset === 0) return tz;
  const sign = offset > 0 ? '+' : '';
  return `${tz} (UTC${sign}${offset})`;
};

const columnMappingPropType = PropTypes.shape({
  columnIndex: PropTypes.number.isRequired,
  role: PropTypes.string,
  timestampType: PropTypes.string,
  dateFormat: PropTypes.string,
  timeFormat: PropTypes.string,
  timezone: PropTypes.string,
  sensorConfigurationId: PropTypes.number,
  mediumId: PropTypes.number
});

const sensorConfigPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  quantityKindCode: PropTypes.string,
  substanceName: PropTypes.string,
  unitSymbol: PropTypes.string
});

// ─── TimestampConfig ──────────────────────────────────────────────────────────

const TimestampConfig = ({
  mapping,
  columnMappings,
  sampleValues,
  onUpdate
}) => {
  const { formatMessage } = useIntl();

  const handleTypeChange = useCallback(
    e => {
      const newType = e.target.value;

      // Enforce uniqueness: clear same type from other columns
      // (except elapsed_seconds which can have multiples)
      if (newType !== 'elapsed_seconds') {
        columnMappings.forEach(m => {
          if (
            m.columnIndex !== mapping.columnIndex &&
            m.role === 'timestamp' &&
            m.timestampType === newType
          ) {
            onUpdate({
              ...m,
              timestampType: null,
              dateFormat: null,
              timeFormat: null
            });
          }
        });
      }

      onUpdate({
        ...mapping,
        timestampType: newType,
        dateFormat: null,
        timeFormat: null
      });
    },
    [mapping, columnMappings, onUpdate]
  );

  const handleFormatChange = useCallback(
    formatString => {
      if (mapping.timestampType === 'timeOnly') {
        onUpdate({ ...mapping, timeFormat: formatString });
      } else {
        onUpdate({ ...mapping, dateFormat: formatString });
      }
    },
    [mapping, onUpdate]
  );

  const showPillBuilder =
    mapping.timestampType === 'datetime' ||
    mapping.timestampType === 'dateOnly' ||
    mapping.timestampType === 'timeOnly';

  const pillBuilderType = PILL_BUILDER_TYPES.includes(mapping.timestampType)
    ? mapping.timestampType
    : 'datetime';

  const currentFormat =
    mapping.timestampType === 'timeOnly'
      ? mapping.timeFormat || ''
      : mapping.dateFormat || '';

  return (
    <Box
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}
      data-testid={`timestamp-config-${mapping.columnIndex}`}>
      {/* Timestamp type selector */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id={`ts-type-label-${mapping.columnIndex}`}>
          {formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.timestampType'
          })}
        </InputLabel>
        <Select
          labelId={`ts-type-label-${mapping.columnIndex}`}
          value={mapping.timestampType || ''}
          label={formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.timestampType'
          })}
          onChange={handleTypeChange}
          data-testid={`timestamp-type-select-${mapping.columnIndex}`}
          MenuProps={{
            slotProps: {
              paper: {
                'data-testid': `timestamp-type-menu-${mapping.columnIndex}`
              }
            }
          }}>
          {TIMESTAMP_TYPES.map(t => (
            <MenuItem key={t} value={t}>
              {formatMessage({
                id: `ImportObservationsWizard.MapColumnsStep.timestampType.${t}`
              })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* TimestampFormatInput for datetime/dateOnly/timeOnly */}
      {showPillBuilder && (
        <TimestampFormatInput
          timestampType={pillBuilderType}
          sampleValues={sampleValues}
          currentFormat={currentFormat}
          onChange={handleFormatChange}
        />
      )}
    </Box>
  );
};

TimestampConfig.propTypes = {
  mapping: PropTypes.shape({
    columnIndex: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    timestampType: PropTypes.string,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    timezone: PropTypes.string
  }).isRequired,
  columnMappings: PropTypes.arrayOf(columnMappingPropType).isRequired,
  sampleValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  onUpdate: PropTypes.func.isRequired
};

// ─── MeasurementConfig ────────────────────────────────────────────────────────

const MeasurementConfig = ({ mapping, sensorConfigs, onUpdate }) => {
  const { formatMessage } = useIntl();

  const handleSensorChange = useCallback(
    e => {
      onUpdate({ ...mapping, sensorConfigurationId: e.target.value || null });
    },
    [mapping, onUpdate]
  );

  const handleMediumChange = useCallback(
    e => {
      onUpdate({ ...mapping, mediumId: e.target.value || null });
    },
    [mapping, onUpdate]
  );

  return (
    <Box
      sx={{ pl: 3, py: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}
      data-testid={`measurement-config-${mapping.columnIndex}`}>
      <FormControl size="small" sx={{ minWidth: 300 }}>
        <InputLabel id={`sensor-label-${mapping.columnIndex}`}>
          {formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.sensorConfig'
          })}
        </InputLabel>
        <Select
          labelId={`sensor-label-${mapping.columnIndex}`}
          value={mapping.sensorConfigurationId || ''}
          label={formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.sensorConfig'
          })}
          onChange={handleSensorChange}
          data-testid={`sensor-config-select-${mapping.columnIndex}`}
          MenuProps={{
            slotProps: {
              paper: {
                'data-testid': `sensor-config-menu-${mapping.columnIndex}`
              }
            }
          }}>
          <MenuItem value="">
            <em>
              {formatMessage({
                id: 'ImportObservationsWizard.MapColumnsStep.selectSensor'
              })}
            </em>
          </MenuItem>
          {sensorConfigs.map(sc => (
            <MenuItem key={sc.id} value={sc.id}>
              {sc.substanceName
                ? `${formatMessage({ id: `quantityKind.${sc.quantityKindCode}` })} [${sc.substanceName}] (${sc.unitSymbol})`
                : `${formatMessage({ id: `quantityKind.${sc.quantityKindCode}` })} (${sc.unitSymbol})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id={`medium-label-${mapping.columnIndex}`}>
          {formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.medium'
          })}
        </InputLabel>
        <Select
          labelId={`medium-label-${mapping.columnIndex}`}
          value={mapping.mediumId || ''}
          label={formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.medium'
          })}
          onChange={handleMediumChange}
          data-testid={`medium-select-${mapping.columnIndex}`}>
          <MenuItem value="">
            <em>
              {formatMessage({
                id: 'ImportObservationsWizard.MapColumnsStep.selectMedium'
              })}
            </em>
          </MenuItem>
          {MEDIUMS.map(m => (
            <MenuItem key={m.id} value={m.id}>
              {formatMessage({
                id: `ImportObservationsWizard.MapColumnsStep.medium.${m.code}`
              })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

MeasurementConfig.propTypes = {
  mapping: PropTypes.shape({
    columnIndex: PropTypes.number.isRequired,
    role: PropTypes.string.isRequired,
    sensorConfigurationId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    mediumId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  sensorConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      quantityKindCode: PropTypes.string.isRequired,
      unitSymbol: PropTypes.string.isRequired
    })
  ).isRequired,
  onUpdate: PropTypes.func.isRequired
};

// ─── ColumnRoleTable ──────────────────────────────────────────────────────────

const ColumnRoleTable = ({
  columnHeaders,
  sampleValues,
  columnMappings,
  sensorConfigs,
  onUpdateMapping
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const getRowBackground = role => {
    switch (role) {
      case 'timestamp':
        return theme.palette.secondary3Color;
      case 'measurement':
      case 'decimal_part':
        return theme.palette.secondary.veryLight;
      default:
        return 'inherit';
    }
  };

  const getRowSx = role => {
    const base = { backgroundColor: getRowBackground(role) };
    if (role === 'excluded') {
      return {
        ...base,
        opacity: 0.5,
        textDecoration: 'line-through'
      };
    }
    return base;
  };

  const getDecimalPartError = (colIndex, mappings) => {
    if (colIndex === 0) {
      return formatMessage({
        id: 'ImportObservationsWizard.MapColumnsStep.decimalPartFirstColumnError'
      });
    }
    const prevMapping = mappings.find(m => m.columnIndex === colIndex - 1);
    if (!prevMapping || prevMapping.role !== 'measurement') {
      return formatMessage({
        id: 'ImportObservationsWizard.MapColumnsStep.decimalPartPrecedingError'
      });
    }
    return null;
  };

  return (
    <Box sx={{ overflowX: 'auto' }} data-testid="column-role-table">
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.MapColumnsStep.columnHeader'
              })}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.MapColumnsStep.sampleValuesHeader'
              })}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.MapColumnsStep.roleHeader'
              })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {columnHeaders.map((header, colIndex) => {
            const mapping = columnMappings.find(
              m => m.columnIndex === colIndex
            ) || { columnIndex: colIndex, role: '' };
            const samples = sampleValues[colIndex] || [];
            const decimalPartError =
              mapping.role === 'decimal_part'
                ? getDecimalPartError(colIndex, columnMappings)
                : null;

            return (
              <React.Fragment key={`col-${mapping.columnIndex}`}>
                <TableRow
                  sx={getRowSx(mapping.role)}
                  data-testid={`column-row-${colIndex}`}>
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                      ...(mapping.role === 'excluded'
                        ? { textDecoration: 'line-through' }
                        : {})
                    }}>
                    {header}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={samples.join(', ')} placement="top">
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          ...(mapping.role === 'excluded'
                            ? { textDecoration: 'line-through' }
                            : {})
                        }}>
                        {samples.join(', ')}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 0.5,
                        flexWrap: 'wrap'
                      }}>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={mapping.role || ''}
                          displayEmpty
                          onChange={e => {
                            const newRole = e.target.value;
                            onUpdateMapping({
                              ...mapping,
                              role: newRole,
                              // Reset config fields on role change
                              timestampType:
                                newRole === 'timestamp'
                                  ? mapping.timestampType || null
                                  : null,
                              dateFormat: null,
                              timeFormat: null,
                              timezone:
                                newRole === 'timestamp'
                                  ? mapping.timezone || 'UTC'
                                  : null,
                              sensorConfigurationId:
                                newRole === 'measurement'
                                  ? mapping.sensorConfigurationId || null
                                  : null,
                              mediumId: null
                            });
                          }}
                          data-testid={`role-select-${colIndex}`}
                          MenuProps={{
                            slotProps: {
                              paper: {
                                'data-testid': `role-menu-${colIndex}`
                              }
                            }
                          }}>
                          <MenuItem value="" disabled>
                            <em>
                              {formatMessage({
                                id: 'ImportObservationsWizard.MapColumnsStep.selectRole'
                              })}
                            </em>
                          </MenuItem>
                          {ROLES.map(role => (
                            <MenuItem key={role} value={role}>
                              {formatMessage({
                                id: `ImportObservationsWizard.MapColumnsStep.role.${role}`
                              })}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {mapping.role === 'timestamp' && (
                        <TimestampConfig
                          mapping={mapping}
                          columnMappings={columnMappings}
                          sampleValues={(sampleValues[colIndex] || []).slice(
                            0,
                            10
                          )}
                          onUpdate={onUpdateMapping}
                        />
                      )}
                      {mapping.role === 'measurement' && (
                        <MeasurementConfig
                          mapping={mapping}
                          sensorConfigs={sensorConfigs}
                          onUpdate={onUpdateMapping}
                        />
                      )}
                    </Box>
                    {decimalPartError && (
                      <Alert
                        severity="error"
                        sx={{ mt: 0.5, py: 0.25, px: 0.5 }}
                        data-testid={`decimal-part-error-${colIndex}`}>
                        {decimalPartError}
                      </Alert>
                    )}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      {/* Timezone selector — shown once when any column has timestamp role */}
      {columnMappings.some(m => m.role === 'timestamp') && (
        <Box sx={{ mt: 1, maxWidth: 320 }}>
          <Autocomplete
            size="small"
            options={sortedTimezones}
            value={
              columnMappings.find(m => m.role === 'timestamp')?.timezone ||
              'UTC'
            }
            onChange={(_e, newValue) => {
              columnMappings.forEach(m => {
                if (m.role === 'timestamp') {
                  onUpdateMapping({ ...m, timezone: newValue || 'UTC' });
                }
              });
            }}
            disableClearable
            getOptionLabel={tz => formatTimezoneLabel(tz)}
            renderInput={params => (
              <TextField
                {...params}
                required
                label={formatMessage({
                  id: 'ImportObservationsWizard.MapColumnsStep.timezone'
                })}
                data-testid="timezone-input"
              />
            )}
            data-testid="timezone-autocomplete"
          />
        </Box>
      )}
    </Box>
  );
};

ColumnRoleTable.propTypes = {
  columnHeaders: PropTypes.arrayOf(PropTypes.string).isRequired,
  sampleValues: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
    .isRequired,
  columnMappings: PropTypes.arrayOf(columnMappingPropType).isRequired,
  sensorConfigs: PropTypes.arrayOf(sensorConfigPropType).isRequired,
  onUpdateMapping: PropTypes.func.isRequired
};

// ─── MapColumnsStep ───────────────────────────────────────────────────────────

const MapColumnsStep = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const rawRows = useSelector(state => state.importWizard.rawRows);
  const headerRow = useSelector(state => state.importWizard.headerRow);
  const skipFirstRows = useSelector(state => state.importWizard.skipFirstRows);
  const skipLastRows = useSelector(state => state.importWizard.skipLastRows);
  const columnMappings = useSelector(
    state => state.importWizard.columnMappings
  );
  const sensorConfigs = useSelector(state => state.importWizard.sensorConfigs);

  // Compute data rows (excluding header, skipped first rows, and skipped last rows)
  const dataRows = useMemo(() => {
    const startIdx = (headerRow >= 0 ? headerRow + 1 : 0) + skipFirstRows;
    const endIdx =
      skipLastRows > 0 ? rawRows.length - skipLastRows : rawRows.length;
    return rawRows.slice(startIdx, endIdx);
  }, [rawRows, headerRow, skipFirstRows, skipLastRows]);

  // Compute column headers
  const columnHeaders = useMemo(() => {
    const headerCells =
      headerRow >= 0 && rawRows[headerRow] ? rawRows[headerRow] : [];
    const maxCols = Math.max(
      ...dataRows.slice(0, PREVIEW_COUNT).map(r => r.length),
      ...dataRows.slice(-PREVIEW_COUNT).map(r => r.length),
      0
    );
    // Use header cells only if they cover all data columns;
    // otherwise fall back to generic Col 1, Col 2, etc.
    const useHeaderCells =
      headerCells.length > 0 && headerCells.length >= maxCols;
    const colCount = maxCols;
    if (useHeaderCells) {
      return Array.from(
        { length: colCount },
        (_, i) => headerCells[i] || `Col ${i + 1}`
      );
    }
    return Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);
  }, [rawRows, headerRow, dataRows]);

  // Compute sample values per column (first 10 + last 10)
  const sampleValues = useMemo(() => {
    const firstRows = dataRows.slice(0, PREVIEW_COUNT);
    // Enough rows for two disjoint windows: take the last ones. Enough for
    // one and a bit: take whatever follows the first window. Otherwise the
    // first window already covers everything.
    let lastRows = [];
    if (dataRows.length > PREVIEW_COUNT * 2)
      lastRows = dataRows.slice(-PREVIEW_COUNT);
    else if (dataRows.length > PREVIEW_COUNT)
      lastRows = dataRows.slice(PREVIEW_COUNT);
    const sampleRows = [...firstRows, ...lastRows];

    return columnHeaders.map((_, colIdx) =>
      sampleRows
        .map(row => row[colIdx] || '')
        .filter(v => v !== '')
        .slice(0, 20)
    );
  }, [dataRows, columnHeaders]);

  // Initialize or extend column mappings to match columnHeaders
  React.useEffect(() => {
    if (columnHeaders.length === 0) return;
    if (columnMappings.length === 0) {
      const initialMappings = columnHeaders.map((_, i) => ({
        columnIndex: i,
        role: '',
        timestampType: null,
        dateFormat: null,
        timeFormat: null,
        timezone: null,
        sensorConfigurationId: null,
        mediumId: null
      }));
      dispatch({ type: SET_COLUMN_MAPPINGS, columnMappings: initialMappings });
    } else if (columnMappings.length < columnHeaders.length) {
      // Data rows have more columns than current mappings — extend
      const extended = [...columnMappings];
      for (let i = columnMappings.length; i < columnHeaders.length; i += 1) {
        extended.push({
          columnIndex: i,
          role: '',
          timestampType: null,
          dateFormat: null,
          timeFormat: null,
          timezone: null,
          sensorConfigurationId: null,
          mediumId: null
        });
      }
      dispatch({ type: SET_COLUMN_MAPPINGS, columnMappings: extended });
    }
  }, [columnHeaders, columnMappings, dispatch]);

  // Auto-select next logical timestamp type for new timestamp columns
  const getAutoTimestampType = useCallback(currentMappings => {
    const existingTypes = currentMappings
      .filter(m => m.role === 'timestamp' && m.timestampType)
      .map(m => m.timestampType);

    if (existingTypes.length === 0) return null;

    // Find the last assigned type in sequence and pick the next one
    const lastType = existingTypes[existingTypes.length - 1];
    const lastIdx = TIMESTAMP_TYPE_SEQUENCE.indexOf(lastType);

    if (lastType === 'elapsed_seconds') {
      return 'elapsed_seconds';
    }

    if (lastIdx >= 0 && lastIdx < TIMESTAMP_TYPE_SEQUENCE.length - 1) {
      const nextType = TIMESTAMP_TYPE_SEQUENCE[lastIdx + 1];
      // Skip types already used (except elapsed_seconds)
      if (nextType !== 'elapsed_seconds' && existingTypes.includes(nextType)) {
        // Find next available
        for (let i = lastIdx + 2; i < TIMESTAMP_TYPE_SEQUENCE.length; i += 1) {
          const candidate = TIMESTAMP_TYPE_SEQUENCE[i];
          if (
            candidate === 'elapsed_seconds' ||
            !existingTypes.includes(candidate)
          ) {
            return candidate;
          }
        }
        return 'elapsed_seconds';
      }
      return nextType;
    }

    return 'elapsed_seconds';
  }, []);

  const handleUpdateMapping = useCallback(
    updatedMapping => {
      const existsInMappings = columnMappings.some(
        m => m.columnIndex === updatedMapping.columnIndex
      );

      let newMappings = existsInMappings
        ? columnMappings.map(m =>
            m.columnIndex === updatedMapping.columnIndex ? updatedMapping : m
          )
        : [...columnMappings, updatedMapping];

      let needsBatchUpdate = !existsInMappings;

      // Auto-select timestamp type when assigning timestamp role
      if (
        updatedMapping.role === 'timestamp' &&
        !updatedMapping.timestampType
      ) {
        const autoType = getAutoTimestampType(
          newMappings.filter(
            m =>
              m.columnIndex !== updatedMapping.columnIndex &&
              m.role === 'timestamp'
          )
        );
        if (autoType) {
          // Check uniqueness before auto-assigning
          if (autoType !== 'elapsed_seconds') {
            newMappings = newMappings.map(m => {
              if (
                m.columnIndex !== updatedMapping.columnIndex &&
                m.role === 'timestamp' &&
                m.timestampType === autoType
              ) {
                needsBatchUpdate = true;
                return {
                  ...m,
                  timestampType: null,
                  dateFormat: null,
                  timeFormat: null
                };
              }
              return m;
            });
          }
          newMappings = newMappings.map(m =>
            m.columnIndex === updatedMapping.columnIndex
              ? { ...m, timestampType: autoType }
              : m
          );
          needsBatchUpdate = true;
        }
      }

      // Check if other mappings were modified (uniqueness clearing)
      const otherMappingsChanged = newMappings.some(
        (m, idx) =>
          m !== columnMappings[idx] &&
          m.columnIndex !== updatedMapping.columnIndex
      );

      if (needsBatchUpdate || otherMappingsChanged) {
        dispatch({
          type: SET_COLUMN_MAPPINGS,
          columnMappings: newMappings
        });
      } else {
        // Single column update
        const finalMapping = newMappings.find(
          m => m.columnIndex === updatedMapping.columnIndex
        );
        dispatch({
          type: UPDATE_COLUMN_MAPPING,
          columnMapping: finalMapping
        });
      }
    },
    [columnMappings, dispatch, getAutoTimestampType]
  );

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      data-testid="map-columns-step">
      <Typography variant="h3" component="h2">
        {formatMessage({
          id: 'ImportObservationsWizard.MapColumnsStep.title'
        })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {formatMessage({
          id: 'ImportObservationsWizard.MapColumnsStep.description'
        })}
      </Typography>
      {columnHeaders.length > 0 && (
        <ColumnRoleTable
          columnHeaders={columnHeaders}
          sampleValues={sampleValues}
          columnMappings={columnMappings}
          sensorConfigs={sensorConfigs}
          onUpdateMapping={handleUpdateMapping}
        />
      )}
      {columnHeaders.length === 0 && (
        <Alert severity="info" data-testid="no-columns-alert">
          {formatMessage({
            id: 'ImportObservationsWizard.MapColumnsStep.noColumns'
          })}
        </Alert>
      )}
    </Box>
  );
};

export default MapColumnsStep;
