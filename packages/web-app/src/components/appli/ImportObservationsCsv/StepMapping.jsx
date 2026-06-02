import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { blue, orange } from '@mui/material/colors';
import {
  COLUMN_ROLES,
  DATE_FORMATS,
  DATE_ONLY_FORMATS,
  MEDIA,
  QUANTITY_KINDS,
  QUANTITY_MEDIUM_MAP,
  QUANTITY_UNIT_MAP,
  TIME_ONLY_FORMATS,
  TIMESTAMP_TYPES,
  TIMEZONES,
  UNITS
} from './constants';

const ROLE_OPTIONS = [
  { value: COLUMN_ROLES.TIMESTAMP, label: 'Timestamp' },
  { value: COLUMN_ROLES.MEASUREMENT, label: 'Measurement' },
  { value: COLUMN_ROLES.DECIMAL_PART, label: 'Decimals of prev.' },
  { value: COLUMN_ROLES.EXCLUDED, label: 'Excluded' }
];

const StepMapping = ({ state, dispatch }) => {
  const { rawData, headerRow, skipLastRows, columnMappings, dateFormat, dateOnlyFormat, timeOnlyFormat, timezone } = state;
  const hasHeader = headerRow != null;
  const maxCols = rawData.reduce((max, row) => Math.max(max, row.length), 0);
  const headerRowData = hasHeader && rawData.length > headerRow
    ? rawData[headerRow]
    : null;
  const headers = headerRowData && headerRowData.length >= maxCols
    ? headerRowData
    : (maxCols > 0 ? Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`) : []);

  // Find the next timestamp type to auto-assign on new timestamp columns
  const nextTimestampType = useMemo(() => {
    const tsCols = Object.entries(columnMappings)
      .filter(([_, m]) => m.role === COLUMN_ROLES.TIMESTAMP && m.timestampType)
      .map(([idx, m]) => ({ index: Number(idx), type: m.timestampType }))
      .sort((a, b) => a.index - b.index);
    if (tsCols.length === 0) return null;
    const last = tsCols[tsCols.length - 1];

    // If the last one is already elapsed_seconds, keep suggesting it (it stacks)
    if (last.type === 'elapsed_seconds') return 'elapsed_seconds';

    // Otherwise find what comes next in the sequence
    const typeValues = TIMESTAMP_TYPES.map(t => t.value);
    const lastIdx = typeValues.indexOf(last.type);
    if (lastIdx >= 0 && lastIdx < typeValues.length - 1) {
      return typeValues[lastIdx + 1];
    }
    // Past the end of the list → default to elapsed_seconds
    return 'elapsed_seconds';
  }, [columnMappings]);

  const handleRoleChange = useCallback(
    (colIndex, role) => {
      dispatch({ type: 'SET_COLUMN_ROLE', payload: { colIndex, role } });
      // Auto-assign next timestamp type
      if (role === COLUMN_ROLES.TIMESTAMP && nextTimestampType) {
        dispatch({
          type: 'SET_COLUMN_TIMESTAMP_TYPE',
          payload: { colIndex, timestampType: nextTimestampType }
        });
      }
    },
    [dispatch, nextTimestampType]
  );

  const handleTimestampTypeChange = useCallback(
    (colIndex, timestampType) => {
      dispatch({
        type: 'SET_COLUMN_TIMESTAMP_TYPE',
        payload: { colIndex, timestampType }
      });
    },
    [dispatch]
  );

  const handleQuantityKindChange = useCallback(
    (colIndex, quantityKind) => {
      dispatch({
        type: 'SET_COLUMN_QUANTITY_KIND',
        payload: { colIndex, quantityKind }
      });

      if (quantityKind) {
        // Auto-select first compatible unit
        const unitIds = QUANTITY_UNIT_MAP[quantityKind.id] || [];
        const firstUnit = unitIds.length > 0
          ? UNITS.find(u => u.id === unitIds[0])
          : null;
        dispatch({
          type: 'SET_COLUMN_UNIT',
          payload: { colIndex, unit: firstUnit }
        });

        // Auto-select default medium
        const mediumId = QUANTITY_MEDIUM_MAP[quantityKind.id];
        const medium = mediumId ? MEDIA.find(m => m.id === mediumId) : null;
        dispatch({
          type: 'SET_COLUMN_MEDIUM',
          payload: { colIndex, medium }
        });
      } else {
        dispatch({ type: 'SET_COLUMN_UNIT', payload: { colIndex, unit: null } });
        dispatch({ type: 'SET_COLUMN_MEDIUM', payload: { colIndex, medium: null } });
      }
    },
    [dispatch]
  );

  const handleUnitChange = useCallback(
    (colIndex, unit) => {
      dispatch({ type: 'SET_COLUMN_UNIT', payload: { colIndex, unit } });
    },
    [dispatch]
  );

  const handleMediumChange = useCallback(
    (colIndex, medium) => {
      dispatch({ type: 'SET_COLUMN_MEDIUM', payload: { colIndex, medium } });
    },
    [dispatch]
  );

  const handleDateFormatChange = useCallback(
    e => {
      dispatch({ type: 'SET_DATE_FORMAT', payload: e.target.value });
    },
    [dispatch]
  );

  const handleDateOnlyFormatChange = useCallback(
    e => {
      dispatch({ type: 'SET_DATE_ONLY_FORMAT', payload: e.target.value });
    },
    [dispatch]
  );

  const handleTimeOnlyFormatChange = useCallback(
    e => {
      dispatch({ type: 'SET_TIME_ONLY_FORMAT', payload: e.target.value });
    },
    [dispatch]
  );

  const handleTimezoneChange = useCallback(
    (_, val) => {
      dispatch({ type: 'SET_TIMEZONE', payload: val ? val.value : 'UTC' });
    },
    [dispatch]
  );

  // Get units available for a given quantity kind
  const getUnitsForQuantityKind = quantityKind => {
    if (!quantityKind) return [];
    const unitIds = QUANTITY_UNIT_MAP[quantityKind.id] || [];
    return UNITS.filter(u => unitIds.includes(u.id));
  };

  // Sample values from the first 3 and last 3 data rows for each column
  const startIdx = hasHeader ? headerRow + 1 : 0;
  const endIdx = skipLastRows > 0 ? rawData.length - skipLastRows : rawData.length;
  const dataRows = rawData.slice(startIdx, Math.max(startIdx, endIdx));
  const sampleFirst = dataRows.slice(0, 10);
  const sampleLast = dataRows.length > 20 ? dataRows.slice(-10) : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body1">
        Assign a role to each column. Timestamp columns need a type. Measurement
        columns need a quantity kind and unit.
        {' '}({dataRows.length} data rows to process)
      </Typography>

      {/* Contextual config fields */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Autocomplete
          size="small"
          options={TIMEZONES}
          getOptionLabel={opt => opt.label}
          value={TIMEZONES.find(tz => tz.value === timezone) || null}
          onChange={handleTimezoneChange}
          renderInput={params => (
            <TextField {...params} label="Timezone" />
          )}
          sx={{ minWidth: 300 }}
          isOptionEqualToValue={(opt, val) => opt.value === val.value}
        />
      </Box>

      {/* Column mapping table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Sample</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type / Quantity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Medium</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {headers.map((header, colIdx) => {
              const mapping = columnMappings[colIdx] || {};
              const isTimestamp = mapping.role === COLUMN_ROLES.TIMESTAMP;
              const isMeasurement = mapping.role === COLUMN_ROLES.MEASUREMENT;
              const isDecimalPart = mapping.role === COLUMN_ROLES.DECIMAL_PART;
              const isExcluded = mapping.role === COLUMN_ROLES.EXCLUDED;
              const excludedSx = isExcluded
                ? { textDecoration: 'line-through', opacity: 0.5 }
                : {};

              let rowBgColor;
              if (isTimestamp) rowBgColor = blue[50];
              else if (isMeasurement || isDecimalPart) rowBgColor = orange[50];

              const firstSamples = sampleFirst.map(r => r[colIdx] || '');
              const lastSamples = sampleLast.map(r => r[colIdx] || '');
              const allSamples = sampleLast.length > 0
                ? [...firstSamples, '...', ...lastSamples]
                : firstSamples;
              const sampleText = allSamples.join(', ');
              const displayText = sampleText.length > 40
                ? `${sampleText.slice(0, 40)}…`
                : sampleText;

              const availableUnits = getUnitsForQuantityKind(mapping.quantityKind);

              return (
                <TableRow
                  key={colIdx}
                  sx={{
                    ...excludedSx,
                    ...(rowBgColor && { bgcolor: rowBgColor })
                  }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" sx={excludedSx}>
                      {header || `Col ${colIdx + 1}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={sampleText} arrow placement="top">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 200,
                          display: 'block',
                          cursor: 'default',
                          ...excludedSx
                        }}>
                        {displayText}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={mapping.role || ''}
                      onChange={e => handleRoleChange(colIdx, e.target.value)}
                      displayEmpty
                      sx={{ minWidth: 120 }}>
                      <MenuItem value="" disabled>
                        <em>Select...</em>
                      </MenuItem>
                      {ROLE_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    {isTimestamp && (
                      <Select
                        size="small"
                        value={mapping.timestampType || ''}
                        onChange={e =>
                          handleTimestampTypeChange(colIdx, e.target.value)
                        }
                        displayEmpty
                        sx={{ minWidth: 180 }}>
                        <MenuItem value="" disabled>
                          <em>Select type...</em>
                        </MenuItem>
                        {TIMESTAMP_TYPES.map(t => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                    {isMeasurement && (
                      <Select
                        size="small"
                        value={mapping.quantityKind?.id ?? ''}
                        onChange={e => {
                          const qk = QUANTITY_KINDS.find(
                            q => q.id === e.target.value
                          );
                          handleQuantityKindChange(colIdx, qk || null);
                        }}
                        displayEmpty
                        sx={{ minWidth: 150 }}>
                        <MenuItem value="" disabled>
                          <em>Quantity...</em>
                        </MenuItem>
                        {QUANTITY_KINDS.map(qk => (
                          <MenuItem key={qk.id} value={qk.id}>
                            {qk.code}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {isTimestamp && mapping.timestampType === 'datetime' && (
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Datetime format</InputLabel>
                        <Select
                          value={dateFormat}
                          label="Datetime format"
                          onChange={handleDateFormatChange}>
                          {DATE_FORMATS.map(fmt => (
                            <MenuItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {isTimestamp && mapping.timestampType === 'date' && (
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Date format</InputLabel>
                        <Select
                          value={dateOnlyFormat}
                          label="Date format"
                          onChange={handleDateOnlyFormatChange}>
                          {DATE_ONLY_FORMATS.map(fmt => (
                            <MenuItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {isTimestamp && mapping.timestampType === 'time' && (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Time format</InputLabel>
                        <Select
                          value={timeOnlyFormat}
                          label="Time format"
                          onChange={handleTimeOnlyFormatChange}>
                          {TIME_ONLY_FORMATS.map(fmt => (
                            <MenuItem key={fmt.value} value={fmt.value}>
                              {fmt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {isMeasurement && (
                      <Select
                        size="small"
                        value={mapping.unit?.id ?? ''}
                        onChange={e => {
                          const u = UNITS.find(
                            unit => unit.id === e.target.value
                          );
                          handleUnitChange(colIdx, u || null);
                        }}
                        displayEmpty
                        disabled={!mapping.quantityKind}
                        sx={{ minWidth: 120 }}>
                        <MenuItem value="" disabled>
                          <em>Unit...</em>
                        </MenuItem>
                        {availableUnits.map(u => (
                          <MenuItem key={u.id} value={u.id}>
                            {u.symbol}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {isMeasurement && (
                      <Select
                        size="small"
                        value={mapping.medium?.id ?? ''}
                        onChange={e => {
                          const med = MEDIA.find(
                            m => m.id === e.target.value
                          );
                          handleMediumChange(colIdx, med || null);
                        }}
                        displayEmpty
                        sx={{ minWidth: 100 }}>
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {MEDIA.map(m => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.code}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

StepMapping.propTypes = {
  state: PropTypes.shape({
    rawData: PropTypes.arrayOf(PropTypes.array).isRequired,
    headerRow: PropTypes.number,
    columnMappings: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired
  }).isRequired,
  dispatch: PropTypes.func.isRequired
};

export default StepMapping;
