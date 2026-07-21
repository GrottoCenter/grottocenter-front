import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import {
  SET_SAMPLING_INTERVAL,
  SET_VALIDATION_RESULT
} from '../../../../actions/Observations/importWizard';
import { buildTimestamp } from '../utils/timestampBuilder';
import { normalizeNumber } from '../utils/numberNormalizer';
import { detectSamplingInterval } from '../utils/samplingIntervalDetector';

// ===== Constants =====

const MAX_INVALID_ROWS_DISPLAY = 20;
const SAMPLE_VALUES_COUNT = 3;
const CHUNK_SIZE = 500;

// ===== InvalidRowsTable sub-component =====

const InvalidRowsTable = ({ invalidRowDetails }) => {
  const { formatMessage } = useIntl();

  const rows = invalidRowDetails.slice(0, MAX_INVALID_ROWS_DISPLAY);

  return (
    <Box sx={{ overflowX: 'auto', mt: 0.5 }} data-testid="invalid-rows-table">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.ValidateStep.invalidRowsTable.rowNumber'
              })}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.ValidateStep.invalidRowsTable.reason'
              })}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {formatMessage({
                id: 'ImportObservationsWizard.ValidateStep.invalidRowsTable.sampleValues'
              })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(detail => (
            <TableRow
              key={detail.rowIndex}
              data-testid={`invalid-row-${detail.rowIndex}`}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {detail.rowIndex + 1}
              </TableCell>
              <TableCell>{detail.reason}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {detail.sampleValues.join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

InvalidRowsTable.propTypes = {
  invalidRowDetails: PropTypes.arrayOf(
    PropTypes.shape({
      rowIndex: PropTypes.number.isRequired,
      reason: PropTypes.string.isRequired,
      sampleValues: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired
};

// ===== ValidateStep component =====

const ValidateStep = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const rawRows = useSelector(state => state.importWizard.rawRows);
  const headerRow = useSelector(state => state.importWizard.headerRow);
  const skipFirstRows = useSelector(state => state.importWizard.skipFirstRows);
  const skipLastRows = useSelector(state => state.importWizard.skipLastRows);
  const columnMappings = useSelector(
    state => state.importWizard.columnMappings
  );
  const numberLocale = useSelector(state => state.importWizard.numberLocale);
  const validationResult = useSelector(
    state => state.importWizard.validationResult
  );

  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  // Derive the timezone from the first timestamp column mapping that has one set
  const timezone = (() => {
    const timestampMapping = columnMappings.find(
      m => m.role === 'timestamp' && m.timezone
    );
    return timestampMapping ? timestampMapping.timezone : 'UTC';
  })();

  const runValidation = useCallback(() => {
    cancelRef.current = false;
    setIsValidating(true);
    setProgress(0);

    // ── Step 1: Check blocking errors ──────────────────────────────────────
    const blockingErrors = [];

    const measurementMappings = columnMappings.filter(
      m => m.role === 'measurement'
    );
    const hasUnlinkedMeasurement = measurementMappings.some(
      m => !m.sensorConfigurationId
    );
    if (hasUnlinkedMeasurement) {
      blockingErrors.push(
        formatMessage({
          id: 'ImportObservationsWizard.ValidateStep.blockingError.missingSensorConfig'
        })
      );
    }

    const hasDatetime = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'datetime'
    );
    const hasDate = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'dateOnly'
    );
    const hasTimeOnly = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'timeOnly'
    );
    const hasElapsed = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'elapsed_seconds'
    );
    const hasYear = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'year'
    );
    const hasMonth = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'month'
    );
    const hasDay = columnMappings.some(
      m => m.role === 'timestamp' && m.timestampType === 'day'
    );

    const hasValidTimestampConfig =
      hasDatetime ||
      hasDate ||
      hasElapsed ||
      (hasYear && hasMonth && hasDay) ||
      (hasTimeOnly && hasElapsed);

    if (!hasValidTimestampConfig) {
      blockingErrors.push(
        formatMessage({
          id: 'ImportObservationsWizard.ValidateStep.blockingError.incompleteTimestamp'
        })
      );
    }

    // ── Step 2: Determine data rows ─────────────────────────────────────────
    const dataStartOffset = headerRow + 1 + skipFirstRows;
    const dataRows = rawRows.slice(
      dataStartOffset,
      rawRows.length - (skipLastRows > 0 ? skipLastRows : 0)
    );

    const totalRows = dataRows.length;

    // Pre-compute error messages outside the loop
    const timestampErrorReason = formatMessage({
      id: 'ImportObservationsWizard.ValidateStep.invalidReason.timestamp'
    });
    const noValidNumbersReason = formatMessage({
      id: 'ImportObservationsWizard.ValidateStep.invalidReason.noValidNumbers'
    });
    const hasMeasurements = measurementMappings.length > 0;

    // ── Step 3: Validate rows in chunks ────────────────────────────────────
    const invalidRowDetails = [];
    const validUtcTimestamps = [];
    let cursor = 0;

    const processChunk = () => {
      if (cancelRef.current) return;

      const end = Math.min(cursor + CHUNK_SIZE, totalRows);

      for (let idx = cursor; idx < end; idx++) {
        const row = dataRows[idx];

        // Check timestamp
        const ts = buildTimestamp(row, columnMappings, timezone);
        if (ts === null) {
          invalidRowDetails.push({
            rowIndex: dataStartOffset + idx,
            reason: timestampErrorReason,
            sampleValues: row.slice(0, SAMPLE_VALUES_COUNT).map(v => v ?? '')
          });
          continue;
        }

        // Check measurement columns
        if (hasMeasurements) {
          const anyValidMeasurement = measurementMappings.some(m => {
            const cellValue = row[m.columnIndex];
            return normalizeNumber(cellValue, numberLocale) !== null;
          });
          if (!anyValidMeasurement) {
            invalidRowDetails.push({
              rowIndex: dataStartOffset + idx,
              reason: noValidNumbersReason,
              sampleValues: row.slice(0, SAMPLE_VALUES_COUNT).map(v => v ?? '')
            });
            continue;
          }
        }

        validUtcTimestamps.push(ts);
      }

      cursor = end;

      if (cursor < totalRows) {
        // Update progress and schedule next chunk
        setProgress(Math.round((cursor / totalRows) * 100));
        requestAnimationFrame(processChunk);
      } else {
        // ── Done: finalize ──────────────────────────────────────────────────
        setProgress(100);

        const invalidRows = invalidRowDetails.length;
        const validRows = totalRows - invalidRows;

        const samplingIntervalSeconds =
          detectSamplingInterval(validUtcTimestamps);
        dispatch({
          type: SET_SAMPLING_INTERVAL,
          samplingIntervalSeconds
        });

        dispatch({
          type: SET_VALIDATION_RESULT,
          validationResult: {
            totalRows,
            validRows,
            invalidRows,
            blockingErrors,
            invalidRowDetails
          }
        });

        setIsValidating(false);
      }
    };

    // Kick off first chunk on next frame so the progress bar renders
    requestAnimationFrame(processChunk);
  }, [
    rawRows,
    columnMappings,
    numberLocale,
    headerRow,
    skipFirstRows,
    skipLastRows,
    timezone,
    formatMessage,
    dispatch
  ]);

  useEffect(() => {
    cancelRef.current = true; // cancel any in-flight validation
    runValidation();
    return () => {
      cancelRef.current = true;
    };
  }, [runValidation]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isValidating || !validationResult) {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
        data-testid="validate-step-loading">
        <Typography variant="body2" color="text.secondary">
          {formatMessage({
            id: 'ImportObservationsWizard.ValidateStep.validating'
          })}
          {progress > 0 && ` ${progress}%`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          data-testid="validation-progress"
        />
      </Box>
    );
  }

  const { blockingErrors, invalidRows, validRows, totalRows, invalidRowDetails } =
    validationResult;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      data-testid="validate-step">
      {/* Blocking errors */}
      {blockingErrors.map((error, idx) => (
        <Alert
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          severity="error"
          data-testid={`blocking-error-${idx}`}>
          {error}
        </Alert>
      ))}
      {/* Warning: some rows are invalid but no blocking errors */}
      {blockingErrors.length === 0 && invalidRows > 0 && (
        <Box data-testid="invalid-rows-warning">
          <Alert severity="warning" sx={{ mb: 0.5 }}>
            {formatMessage(
              {
                id: 'ImportObservationsWizard.ValidateStep.invalidRowsWarning'
              },
              { count: invalidRows, total: totalRows }
            )}
          </Alert>
          <InvalidRowsTable invalidRowDetails={invalidRowDetails} />
        </Box>
      )}
      {/* Success: all rows valid */}
      {blockingErrors.length === 0 && invalidRows === 0 && (
        <Alert severity="success" data-testid="validation-success">
          {formatMessage(
            { id: 'ImportObservationsWizard.ValidateStep.allRowsValid' },
            { count: validRows }
          )}
        </Alert>
      )}
      {/* Summary when there are blocking errors — still show row counts if we
          have rows at all so the user has some context */}
      {blockingErrors.length > 0 && totalRows > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          data-testid="row-count-summary">
          {formatMessage(
            { id: 'ImportObservationsWizard.ValidateStep.rowCountSummary' },
            { total: totalRows, valid: validRows }
          )}
        </Typography>
      )}
    </Box>
  );
};

export default ValidateStep;
