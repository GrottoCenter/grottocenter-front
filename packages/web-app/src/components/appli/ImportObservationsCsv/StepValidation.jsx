import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { normalizeNumber } from './numberUtils';
import { COLUMN_ROLES } from './constants';
import { buildTimestamp, hasValidTimestampConfig } from './timestampUtils';
import resolveRow from './resolveRow';

const StepValidation = ({ state, dispatch }) => {
  const { rawData, headerRow, skipLastRows, columnMappings, dateFormat, dateOnlyFormat, timeOnlyFormat, numberLocale, timezone } = state;

  const validationResult = useMemo(() => {
    const hasHeader = headerRow != null;
    const maxCols = rawData.reduce((max, row) => Math.max(max, row.length), 0);
    const headerRowData = hasHeader && rawData.length > headerRow
      ? rawData[headerRow]
      : null;
    const headers = headerRowData && headerRowData.length >= maxCols
      ? headerRowData
      : (maxCols > 0 ? Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`) : []);
    const startIdx = hasHeader ? headerRow + 1 : 0;
    const endIdx = skipLastRows > 0 ? rawData.length - skipLastRows : rawData.length;
    const dataRows = rawData.slice(startIdx, Math.max(startIdx, endIdx));

    const measurementCols = Object.entries(columnMappings)
      .filter(([_, m]) => m.role === COLUMN_ROLES.MEASUREMENT)
      .map(([idx, m]) => ({ index: Number(idx), ...m }));

    const errors = [];
    const warnings = [];
    const invalidRows = [];
    let validCount = 0;

    // Check timestamp config
    if (!hasValidTimestampConfig(columnMappings)) {
      errors.push('Timestamp configuration is incomplete.');
    }

    // Check measurement columns have quantity kind + unit
    measurementCols.forEach(col => {
      const colName = headers[col.index] || `Col ${col.index + 1}`;
      if (!col.quantityKind) {
        errors.push(`Column "${colName}" is missing a quantity kind.`);
      }
      if (!col.unit) {
        errors.push(`Column "${colName}" is missing a unit.`);
      }
    });

    if (measurementCols.length === 0) {
      errors.push('No measurement columns selected.');
    }

    // Validate rows
    dataRows.forEach((rawRow, rowIdx) => {
      const row = resolveRow(rawRow, columnMappings);
      const ts = buildTimestamp(row, columnMappings, { dateFormat, dateOnlyFormat, timeOnlyFormat, timezone });

      if (!ts) {
        invalidRows.push({
          rowIdx: rowIdx + 1,
          reason: 'Invalid or missing timestamp',
          row
        });
        return;
      }

      let hasValidMeasurement = false;
      measurementCols.forEach(col => {
        const rawVal = row[col.index];
        const num = normalizeNumber(rawVal, numberLocale);
        if (num != null) {
          hasValidMeasurement = true;
        }
      });

      if (!hasValidMeasurement) {
        invalidRows.push({
          rowIdx: rowIdx + 1,
          reason: 'No valid numeric values in measurement columns',
          row
        });
        return;
      }

      validCount += 1;
    });

    if (invalidRows.length > 0) {
      warnings.push(
        `${invalidRows.length} row(s) have issues and will be skipped.`
      );
    }

    return {
      errors,
      warnings,
      invalidRows,
      validCount,
      measurementCols,
      totalRows: dataRows.length
    };
  }, [rawData, headerRow, skipLastRows, columnMappings, dateFormat, dateOnlyFormat, timeOnlyFormat, numberLocale, timezone]);

  // Persist validation to parent state
  React.useEffect(() => {
    dispatch({
      type: 'SET_VALIDATION_RESULT',
      payload: validationResult
    });
  }, [validationResult, dispatch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6">Validation Summary</Typography>

      {validationResult.errors.length > 0 && (
        <Alert severity="error">
          <Typography variant="subtitle2">
            Blocking errors (fix before importing):
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {validationResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      {validationResult.warnings.length > 0 && (
        <Alert severity="warning">
          {validationResult.warnings.map((w, i) => (
            <Typography key={i} variant="body2">
              {w}
            </Typography>
          ))}
        </Alert>
      )}

      {validationResult.errors.length === 0 && (
        <Alert severity="success">
          <Typography variant="body2">
            Ready to generate SQL. {validationResult.validCount} valid rows out
            of {validationResult.totalRows} total.
          </Typography>
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Time series to create:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {validationResult.measurementCols?.map(col => (
            <Chip
              key={col.index}
              label={`${col.quantityKind?.code || '?'} (${col.unit?.symbol || '?'})${col.medium ? ` in ${col.medium.code}` : ''}`}
              color="success"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      {validationResult.invalidRows?.length > 0 && (
        <>
          <Typography variant="subtitle2">
            Invalid rows (first 20):
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row #</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validationResult.invalidRows.slice(0, 20).map(inv => (
                  <TableRow key={inv.rowIdx}>
                    <TableCell>{inv.rowIdx}</TableCell>
                    <TableCell>{inv.reason}</TableCell>
                    <TableCell>
                      <Typography variant="caption" noWrap>
                        {inv.row.slice(0, 5).join(' | ')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

StepValidation.propTypes = {
  state: PropTypes.shape({
    rawData: PropTypes.arrayOf(PropTypes.array).isRequired,
    headerRow: PropTypes.number,
    columnMappings: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    numberLocale: PropTypes.string.isRequired
  }).isRequired,
  dispatch: PropTypes.func.isRequired
};

export default StepValidation;
