import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import generateSql from './generateSql';
import { normalizeNumber } from './numberUtils';
import { COLUMN_ROLES } from './constants';
import { buildTimestamp } from './timestampUtils';
import resolveRow from './resolveRow';

// We use a synthetic index to store the computed timestamp in processed rows
const TS_SLOT = '__timestamp__';

const StepDownload = ({ state, dispatch, onExportProfile }) => {
  const {
    rawData,
    headerRow,
    skipLastRows,
    columnMappings,
    dateFormat,
    dateOnlyFormat,
    timeOnlyFormat,
    numberLocale,
    timezone,
    caveId,
    pointLabel,
    authorId,
    fileName
  } = state;

  const processedData = useMemo(() => {
    const hasHeader = headerRow != null;
    const startIdx = hasHeader ? headerRow + 1 : 0;
    const endIdx = skipLastRows > 0 ? rawData.length - skipLastRows : rawData.length;
    const dataRows = rawData.slice(startIdx, Math.max(startIdx, endIdx));

    const measurementCols = Object.entries(columnMappings)
      .filter(([_, m]) => m.role === COLUMN_ROLES.MEASUREMENT && m.quantityKind && m.unit)
      .map(([idx, m]) => ({ index: Number(idx), ...m }));

    // Process rows: build timestamps and normalize numbers
    const rows = [];
    dataRows.forEach(rawRow => {
      const row = resolveRow(rawRow, columnMappings);
      const ts = buildTimestamp(row, columnMappings, { dateFormat, dateOnlyFormat, timeOnlyFormat, timezone });
      if (!ts) return;

      const processedRow = { [TS_SLOT]: ts };

      let hasValue = false;
      measurementCols.forEach(col => {
        const num = normalizeNumber(row[col.index], numberLocale);
        processedRow[col.index] = num;
        if (num != null) hasValue = true;
      });

      if (hasValue) rows.push(processedRow);
    });

    return { rows, measurementCols };
  }, [rawData, headerRow, skipLastRows, columnMappings, dateFormat, dateOnlyFormat, timeOnlyFormat, numberLocale, timezone]);

  const sql = useMemo(() => {
    const { rows, measurementCols } = processedData;

    const columns = measurementCols.map(col => ({
      ...col,
      role: 'measurement'
    }));
    // Add a virtual timestamp column that uses the TS_SLOT key
    columns.push({
      index: TS_SLOT,
      role: 'timestamp'
    });

    return generateSql({
      caveId: caveId || '0',
      pointLabel: pointLabel || 'Imported Point',
      authorId: authorId || 1,
      timezone: timezone || null,
      columns,
      rows
    });
  }, [processedData, caveId, pointLabel, authorId, timezone]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = (fileName || 'import').replace(/\.[^.]+$/, '');
    a.href = url;
    a.download = `import-${baseName}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sql, fileName]);

  const handleCaveIdChange = useCallback(
    e => dispatch({ type: 'SET_CAVE_ID', payload: e.target.value }),
    [dispatch]
  );

  const handlePointLabelChange = useCallback(
    e => dispatch({ type: 'SET_POINT_LABEL', payload: e.target.value }),
    [dispatch]
  );

  const handleAuthorIdChange = useCallback(
    e => dispatch({ type: 'SET_AUTHOR_ID', payload: e.target.value }),
    [dispatch]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6">Generate SQL Import Script</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Cave ID"
          value={caveId}
          onChange={handleCaveIdChange}
          placeholder="e.g., 74138"
          sx={{ width: 140 }}
        />
        <TextField
          size="small"
          label="Point label"
          value={pointLabel}
          onChange={handlePointLabelChange}
          placeholder="e.g., Clim B 1"
          sx={{ width: 200 }}
        />
        <TextField
          size="small"
          label="Author ID (caver)"
          value={authorId}
          onChange={handleAuthorIdChange}
          placeholder="e.g., 460"
          sx={{ width: 160 }}
        />
      </Box>

      <Alert severity="info">
        <Typography variant="subtitle2" gutterBottom>
          The SQL script will create:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>1 device</li>
          <li>{processedData.measurementCols.length} sensor configuration(s)</li>
          <li>1 point</li>
          <li>1 observation</li>
          <li>{processedData.measurementCols.length} time series</li>
          <li>{processedData.rows.length * processedData.measurementCols.length} measurement inserts</li>
        </Box>
      </Alert>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}>
          Download SQL File
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={onExportProfile}>
          Export profile
        </Button>
      </Box>

      <Box
        component="pre"
        sx={{
          maxHeight: 400,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.100',
          borderRadius: 1,
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
        {sql.slice(0, 5000)}
        {sql.length > 5000 && '\n\n... (truncated preview) ...'}
      </Box>
    </Box>
  );
};

StepDownload.propTypes = {
  state: PropTypes.shape({
    rawData: PropTypes.arrayOf(PropTypes.array).isRequired,
    headerRow: PropTypes.number,
    columnMappings: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    numberLocale: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
    caveId: PropTypes.string.isRequired,
    pointLabel: PropTypes.string.isRequired,
    authorId: PropTypes.string.isRequired,
    fileName: PropTypes.string
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  onExportProfile: PropTypes.func.isRequired
};

export default StepDownload;
