import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
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
  Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { usePapaParse } from 'react-papaparse';
import { ENCODINGS, NUMBER_LOCALES } from './constants';
import detectEncoding from './detectEncoding';

const MAX_PREVIEW_ROWS = 10;

const StepUpload = ({ state, dispatch }) => {
  const { readString } = usePapaParse();
  const fileRef = useRef(null);
  const csvInputRef = useRef(null);

  const parseFile = useCallback(
    (file, encoding) => {
      const reader = new FileReader();
      reader.onload = event => {
        const text = event.target.result;
        readString(text, {
          header: false,
          skipEmptyLines: true,
          complete: results => {
            dispatch({ type: 'SET_RAW_DATA', payload: results.data });
          }
        });
      };
      reader.readAsText(file, encoding);
    },
    [dispatch, readString]
  );

  const handleFileChange = useCallback(
    async e => {
      const file = e.target.files[0];
      if (!file) return;

      fileRef.current = file;
      dispatch({ type: 'SET_FILE_NAME', payload: file.name });

      // Auto-detect encoding
      const detected = await detectEncoding(file);
      dispatch({ type: 'SET_ENCODING', payload: detected });
      parseFile(file, detected);
    },
    [dispatch, parseFile]
  );

  const handleEncodingChange = useCallback(
    e => {
      dispatch({ type: 'SET_ENCODING', payload: e.target.value });
    },
    [dispatch]
  );

  // Re-parse when encoding changes
  useEffect(() => {
    if (fileRef.current) {
      parseFile(fileRef.current, state.encoding);
    }
  }, [state.encoding, parseFile]);

  // Clear file refs on reset (when rawData becomes empty)
  useEffect(() => {
    if (state.rawData.length === 0) {
      fileRef.current = null;
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
    }
  }, [state.rawData]);

  const handleHeaderRowChange = useCallback(
    e => {
      dispatch({
        type: 'SET_HEADER_ROW',
        payload: e.target.value === '' ? null : Number(e.target.value)
      });
    },
    [dispatch]
  );

  const handleSkipLastRowsChange = useCallback(
    e => {
      dispatch({
        type: 'SET_SKIP_LAST_ROWS',
        payload: Number(e.target.value) || 0
      });
    },
    [dispatch]
  );

  const profileInputRef = useRef(null);

  const handleImportProfile = useCallback(
    e => {
      const file = e.target.files[0];
      if (!file) return;
      dispatch({ type: 'SET_PROFILE_NAME', payload: file.name });
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const profile = JSON.parse(event.target.result);
          if (profile.columnMappings) {
            dispatch({ type: 'SET_PROFILE', payload: profile });
          }
        } catch (err) {
          // Invalid JSON — ignore silently
        }
      };
      reader.readAsText(file);
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
    },
    [dispatch]
  );

  const handleLocaleChange = useCallback(
    e => {
      dispatch({ type: 'SET_NUMBER_LOCALE', payload: e.target.value });
    },
    [dispatch]
  );

  const { rawData, headerRow, skipLastRows, numberLocale, fileName, encoding } = state;
  const hasHeader = headerRow != null;
  const maxCols = rawData.reduce((max, row) => Math.max(max, row.length), 0);
  const headerRowData = hasHeader && rawData.length > headerRow
    ? rawData[headerRow]
    : null;
  // Use header row for column names only if it has the expected column count
  const headers = headerRowData && headerRowData.length >= maxCols
    ? headerRowData
    : (maxCols > 0 ? Array.from({ length: maxCols }, (_, i) => `Col ${i + 1}`) : []);
  const startIdx = hasHeader ? headerRow + 1 : 0;
  const endIdx = skipLastRows > 0 ? rawData.length - skipLastRows : rawData.length;
  const dataRows = rawData.slice(startIdx, Math.max(startIdx, endIdx));
  const previewFirst = dataRows.slice(0, MAX_PREVIEW_ROWS);
  const previewLast =
    dataRows.length > MAX_PREVIEW_ROWS * 2
      ? dataRows.slice(-MAX_PREVIEW_ROWS)
      : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}>
          Upload CSV
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            hidden
            ref={csvInputRef}
            onChange={handleFileChange}
          />
        </Button>
        {fileName && (
          <Typography variant="body2" color="text.secondary">
            {fileName} ({dataRows.length} data rows)
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          disabled={rawData.length === 0}
          startIcon={<FileUploadIcon />}>
          Import profile
          <input
            type="file"
            accept=".json"
            hidden
            ref={profileInputRef}
            onChange={handleImportProfile}
          />
        </Button>
        {state.profileName && (
          <Typography variant="body2" color="text.secondary">
            {state.profileName}
          </Typography>
        )}
      </Box>

      {rawData.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Encoding</InputLabel>
            <Select
              value={encoding}
              label="Encoding"
              onChange={handleEncodingChange}>
              {ENCODINGS.map(enc => (
                <MenuItem key={enc.value} value={enc.value}>
                  {enc.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Header / skip rows</InputLabel>
            <Select
              value={headerRow ?? ''}
              label="Header / skip rows"
              onChange={handleHeaderRowChange}>
              <MenuItem value="">
                <em>No rows to skip</em>
              </MenuItem>
              {rawData.slice(0, Math.min(10, rawData.length)).map((row, i) => (
                <MenuItem key={i} value={i}>
                  Row {i + 1}: {row.slice(0, 3).join(' | ')}...
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Skip last rows</InputLabel>
            <Select
              value={skipLastRows}
              label="Skip last rows"
              onChange={handleSkipLastRowsChange}>
              <MenuItem value={0}>
                <em>None (use all rows)</em>
              </MenuItem>
              {rawData.slice(Math.max(0, rawData.length - 10)).map((row, i) => {
                const distFromEnd = rawData.length - (Math.max(0, rawData.length - 10) + i);
                return (
                  <MenuItem key={distFromEnd} value={distFromEnd}>
                    Last {distFromEnd}: {row.slice(0, 3).join(' | ')}...
                  </MenuItem>
                );
              }).reverse()}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Number format</InputLabel>
            <Select
              value={numberLocale}
              label="Number format"
              onChange={handleLocaleChange}>
              {NUMBER_LOCALES.map(loc => (
                <MenuItem key={loc.value} value={loc.value}>
                  {loc.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {headers.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                {headers.map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 'bold' }}>
                    {h || `Col ${i + 1}`}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewFirst.map((row, rowIdx) => (
                <TableRow key={`first-${rowIdx}`}>
                  <TableCell>{rowIdx + 1}</TableCell>
                  {headers.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      {row[colIdx] ?? ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {previewLast.length > 0 && (
                <>
                  <TableRow>
                    <TableCell
                      colSpan={headers.length + 1}
                      align="center"
                      sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                      ... {dataRows.length - MAX_PREVIEW_ROWS * 2} rows hidden
                      ...
                    </TableCell>
                  </TableRow>
                  {previewLast.map((row, rowIdx) => (
                    <TableRow key={`last-${rowIdx}`}>
                      <TableCell>
                        {dataRows.length - MAX_PREVIEW_ROWS + rowIdx + 1}
                      </TableCell>
                      {headers.map((_, colIdx) => (
                        <TableCell key={colIdx}>
                          {row[colIdx] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

StepUpload.propTypes = {
  state: PropTypes.shape({
    rawData: PropTypes.arrayOf(PropTypes.array).isRequired,
    headerRow: PropTypes.number,
    numberLocale: PropTypes.string.isRequired,
    encoding: PropTypes.string.isRequired,
    fileName: PropTypes.string
  }).isRequired,
  dispatch: PropTypes.func.isRequired
};

export default StepUpload;
