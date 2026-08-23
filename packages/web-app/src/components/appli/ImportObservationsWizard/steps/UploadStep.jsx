import { useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
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
  Typography
} from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { useNotification } from '../../../../hooks';
import FileSelectorInput from '../../../common/FileSelectorInput';

import {
  parseAndSetFile,
  SET_COLUMN_MAPPINGS,
  SET_CONFIRMED_DEVICE,
  SET_CONTEXT,
  SET_DOCUMENT_LANGUAGE,
  SET_ENCODING,
  SET_FILE,
  SET_HEADER_ROW,
  SET_NUMBER_LOCALE,
  SET_PROFILE_FILE_NAME,
  SET_RAW_ROWS,
  SET_SAMPLING_INTERVAL,
  SET_SKIP_FIRST_ROWS,
  SET_SKIP_LAST_ROWS,
  SET_VALIDATION_RESULT
} from '../../../../actions/Observations/importWizard';
import { importProfile } from '../utils/profileManager';

// ===== FilePreviewTable sub-component =====

const PREVIEW_COUNT = 10;

const FilePreviewTable = ({
  rawRows,
  headerRow,
  skipFirstRows,
  skipLastRows
}) => {
  const { formatMessage } = useIntl();

  // Data rows start after header row + skipped first rows
  const dataStartIndex = headerRow + 1 + skipFirstRows;
  const dataEndIndex = rawRows.length - (skipLastRows > 0 ? skipLastRows : 0);
  const dataRows = rawRows.slice(dataStartIndex, dataEndIndex);

  const headerCells =
    rawRows[headerRow] && rawRows[headerRow].length > 0
      ? rawRows[headerRow]
      : [];

  // Determine column count from widest data row
  const maxDataColCount =
    dataRows.length > 0
      ? Math.max(
          ...dataRows.slice(0, PREVIEW_COUNT).map(r => r.length),
          ...dataRows.slice(-PREVIEW_COUNT).map(r => r.length)
        )
      : 0;

  // Use header cells only if they cover all data columns;
  // otherwise fall back to generic Col 1, Col 2, etc.
  // Column count is always based on data width (extra header cells are dropped).
  const useHeaderCells =
    headerCells.length > 0 && headerCells.length >= maxDataColCount;

  const colCount = maxDataColCount;

  const columnHeaders = useHeaderCells
    ? Array.from(
        { length: colCount },
        (_, i) => headerCells[i] || `Col ${i + 1}`
      )
    : Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`);

  const firstRows = dataRows.slice(0, PREVIEW_COUNT);
  const lastRows =
    dataRows.length > PREVIEW_COUNT ? dataRows.slice(-PREVIEW_COUNT) : [];
  const hasGap = dataRows.length > PREVIEW_COUNT * 2;

  if (dataRows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {formatMessage({
          id: 'ImportObservationsWizard.UploadStep.noDataRows'
        })}
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', mt: 1 }}>
      <Table
        size="small"
        data-testid="file-preview-table"
        sx={{ minWidth: 400, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', width: 50 }}>
              #
            </TableCell>
            {columnHeaders.map((header, i) => (
              <TableCell
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                sx={{
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {firstRows.map((row, rowIdx) => (
            <TableRow
              // eslint-disable-next-line react/no-array-index-key
              key={`first-${rowIdx}`}>
              <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {dataStartIndex + rowIdx + 1}
              </TableCell>
              {Array.from({ length: colCount }, (_, colIdx) => (
                <TableCell
                  key={colIdx}
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200
                  }}>
                  {row[colIdx] ?? ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {hasGap && (
            <TableRow>
              <TableCell
                colSpan={colCount + 1}
                sx={{ textAlign: 'center', color: 'text.secondary' }}>
                …
              </TableCell>
            </TableRow>
          )}
          {lastRows.map((row, rowIdx) => {
            const actualRowIdx = dataRows.length - lastRows.length + rowIdx;
            return (
              <TableRow
                // eslint-disable-next-line react/no-array-index-key
                key={`last-${rowIdx}`}>
                <TableCell
                  sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {dataStartIndex + actualRowIdx + 1}
                </TableCell>
                {Array.from({ length: colCount }, (_, colIdx) => (
                  <TableCell
                    key={colIdx}
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 200
                    }}>
                    {row[colIdx] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

FilePreviewTable.propTypes = {
  rawRows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  headerRow: PropTypes.number.isRequired,
  skipFirstRows: PropTypes.number.isRequired,
  skipLastRows: PropTypes.number.isRequired
};

// ===== UploadStep component =====

const SUPPORTED_ENCODINGS = ['UTF-8', 'UTF-16', 'windows-1252'];
const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'text/tab-separated-values': ['.tsv'],
  'text/plain': ['.txt']
};

const UploadStep = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { onError, onSuccess } = useNotification();

  const file = useSelector(state => state.importWizard.file);
  const rawRows = useSelector(state => state.importWizard.rawRows);
  const encoding = useSelector(state => state.importWizard.encoding);
  const headerRow = useSelector(state => state.importWizard.headerRow);
  const skipFirstRows = useSelector(state => state.importWizard.skipFirstRows);
  const skipLastRows = useSelector(state => state.importWizard.skipLastRows);
  const numberLocale = useSelector(state => state.importWizard.numberLocale);
  const profileFileName = useSelector(
    state => state.importWizard.profileFileName
  );

  // Hidden profile input ref
  const profileInputRef = useRef(null);

  // Derive data rows for counting
  const dataStartIndex = headerRow + 1 + skipFirstRows;
  const dataEndIndex = rawRows.length - (skipLastRows > 0 ? skipLastRows : 0);
  const dataRows = rawRows.slice(dataStartIndex, dataEndIndex);

  // ===== Handlers =====

  const clearParsedFileData = () => {
    dispatch({ type: SET_RAW_ROWS, rawRows: [] });
    dispatch({ type: SET_COLUMN_MAPPINGS, columnMappings: [] });
    dispatch({ type: SET_VALIDATION_RESULT, validationResult: null });
    dispatch({ type: SET_SAMPLING_INTERVAL, samplingIntervalSeconds: null });
  };

  const handleFilesAdd = ([selectedFile]) => {
    if (!selectedFile) return;
    clearParsedFileData();
    dispatch(parseAndSetFile(selectedFile, null));
  };

  const handleFileRemove = () => {
    dispatch({ type: SET_FILE, file: null });
    clearParsedFileData();
  };

  const handleFileRejections = () => {
    onError(
      formatMessage({
        id: 'This file was rejected.'
      })
    );
  };

  const handleEncodingChange = e => {
    const newEncoding = e.target.value;
    dispatch({ type: SET_ENCODING, encoding: newEncoding });
    if (file) {
      dispatch(parseAndSetFile(file, newEncoding));
    }
  };

  const handleHeaderRowChange = e => {
    const { value } = e.target;
    const newHeaderRow = value === 'none' ? -1 : Number(value);
    dispatch({ type: SET_HEADER_ROW, headerRow: newHeaderRow });
    dispatch({ type: SET_COLUMN_MAPPINGS, columnMappings: [] });
  };

  const handleSkipFirstRowsChange = e => {
    const value = Math.max(0, parseInt(e.target.value, 10) || 0);
    dispatch({ type: SET_SKIP_FIRST_ROWS, skipFirstRows: value });
  };

  const handleSkipLastRowsChange = e => {
    const value = Math.max(0, parseInt(e.target.value, 10) || 0);
    dispatch({ type: SET_SKIP_LAST_ROWS, skipLastRows: value });
  };

  const handleNumberLocaleChange = e => {
    dispatch({ type: SET_NUMBER_LOCALE, locale: e.target.value });
  };

  const handleImportProfileClick = () => {
    if (profileInputRef.current) {
      profileInputRef.current.click();
    }
  };

  const handleProfileFileChange = async e => {
    const profileFile = e.target.files && e.target.files[0];
    if (!profileFile) return;
    const importedFileName = profileFile.name;
    e.target.value = '';

    try {
      const text = await profileFile.text();
      const parsed = JSON.parse(text);
      const result = importProfile(parsed);
      if (!result.ok) {
        onError(
          formatMessage(
            { id: 'ImportObservationsWizard.UploadStep.profileImportError' },
            { error: result.error }
          )
        );
        return;
      }

      const { state: profileState } = result;

      // Apply parsed profile state to Redux
      if (profileState.encoding !== undefined) {
        dispatch({ type: SET_ENCODING, encoding: profileState.encoding });
      }
      if (profileState.headerRow !== undefined) {
        dispatch({ type: SET_HEADER_ROW, headerRow: profileState.headerRow });
      }
      if (profileState.skipLastRows !== undefined) {
        dispatch({
          type: SET_SKIP_LAST_ROWS,
          skipLastRows: profileState.skipLastRows
        });
      }
      if (profileState.skipFirstRows !== undefined) {
        dispatch({
          type: SET_SKIP_FIRST_ROWS,
          skipFirstRows: profileState.skipFirstRows
        });
      }
      if (profileState.numberLocale !== undefined) {
        dispatch({
          type: SET_NUMBER_LOCALE,
          locale: profileState.numberLocale
        });
      }
      if (profileState.columnMappings !== undefined) {
        dispatch({
          type: SET_COLUMN_MAPPINGS,
          columnMappings: profileState.columnMappings
        });
      }
      if (profileState.documentLanguage !== undefined) {
        dispatch({
          type: SET_DOCUMENT_LANGUAGE,
          documentLanguage: profileState.documentLanguage
        });
      }
      if (profileState.context !== undefined) {
        dispatch({ type: SET_CONTEXT, context: profileState.context });
      }

      // Store device ID as a pending confirmed device (DeviceSensorsStep will fetch the full data)
      const profileDeviceId =
        profileState.deviceId ??
        (profileState.confirmedDevice && profileState.confirmedDevice.id) ??
        null;
      if (profileDeviceId != null) {
        dispatch({
          type: SET_CONFIRMED_DEVICE,
          device: {
            id: profileDeviceId,
            name: null,
            brandName: null,
            author: null
          }
        });
      }

      onSuccess(
        formatMessage({
          id: 'ImportObservationsWizard.UploadStep.profileImportSuccess'
        })
      );

      dispatch({
        type: SET_PROFILE_FILE_NAME,
        profileFileName: importedFileName
      });

      // Re-parse the file with the new encoding if it changed
      if (
        file &&
        profileState.encoding !== undefined &&
        profileState.encoding !== encoding
      ) {
        dispatch(parseAndSetFile(file, profileState.encoding));
      }
    } catch (err) {
      onError(
        formatMessage(
          { id: 'ImportObservationsWizard.UploadStep.profileImportError' },
          { error: err.message }
        )
      );
    }
  };

  // Build header row dropdown options from first 10 raw rows
  const headerRowOptions = rawRows.slice(0, 10).map((row, idx) => ({
    value: idx,
    label: `${formatMessage(
      { id: 'ImportObservationsWizard.UploadStep.rowLabel' },
      { row: idx + 1 }
    )}: ${row.slice(0, 5).join(', ')}${row.length > 5 ? '…' : ''}`
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* File picker */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {formatMessage({
            id: 'ImportObservationsWizard.UploadStep.fileLabel'
          })}
        </Typography>
        <input
          ref={profileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          data-testid="profile-input"
          onChange={handleProfileFileChange}
        />
        <Box data-testid="observation-file-selector">
          <FileSelectorInput
            files={file ? [{ fileName: file.name }] : []}
            multiple={false}
            accept={ACCEPTED_FILE_TYPES}
            onFilesAdd={handleFilesAdd}
            onFileRemove={handleFileRemove}
            onFileRejections={handleFileRejections}
          />
        </Box>
        {file && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
            data-testid="file-info">
            {formatMessage(
              {
                id: 'ImportObservationsWizard.UploadStep.dataRowCount'
              },
              { count: dataRows.length }
            )}
          </Typography>
        )}
        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileOpenIcon />}
            disabled={rawRows.length === 0}
            onClick={handleImportProfileClick}
            data-testid="import-profile-button">
            {formatMessage({
              id: 'ImportObservationsWizard.UploadStep.importProfile'
            })}
          </Button>
          {profileFileName && (
            <Typography
              variant="body2"
              color="text.secondary"
              data-testid="profile-file-info">
              {profileFileName}
            </Typography>
          )}
        </Box>
      </Box>
      {rawRows.length > 0 && (
        <>
          {/* Encoding + Number format (side by side) */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="encoding-label">
                {formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.encodingLabel'
                })}
              </InputLabel>
              <Select
                labelId="encoding-label"
                value={encoding}
                label={formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.encodingLabel'
                })}
                onChange={handleEncodingChange}
                data-testid="encoding-select">
                {SUPPORTED_ENCODINGS.map(enc => (
                  <MenuItem key={enc} value={enc}>
                    {enc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="number-locale-label">
                {formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.numberLocaleLabel'
                })}
              </InputLabel>
              <Select
                labelId="number-locale-label"
                value={numberLocale}
                label={formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.numberLocaleLabel'
                })}
                onChange={handleNumberLocaleChange}
                data-testid="number-locale-select">
                <MenuItem value="en">
                  {formatMessage({
                    id: 'ImportObservationsWizard.UploadStep.dotDecimal'
                  })}
                </MenuItem>
                <MenuItem value="fr">
                  {formatMessage({
                    id: 'ImportObservationsWizard.UploadStep.commaDecimal'
                  })}
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Header row + Skip first rows + Skip last rows (side by side) */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 300, maxWidth: 400 }}>
              <InputLabel id="header-row-label">
                {formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.headerRowLabel'
                })}
              </InputLabel>
              <Select
                labelId="header-row-label"
                value={headerRow === -1 ? 'none' : headerRow}
                label={formatMessage({
                  id: 'ImportObservationsWizard.UploadStep.headerRowLabel'
                })}
                onChange={handleHeaderRowChange}
                data-testid="header-row-select"
                MenuProps={{
                  PaperProps: {
                    sx: { maxWidth: 400 }
                  }
                }}
                sx={{
                  '& .MuiSelect-select': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }
                }}>
                <MenuItem value="none">
                  {formatMessage({
                    id: 'ImportObservationsWizard.UploadStep.noRowsToSkip'
                  })}
                </MenuItem>
                {headerRowOptions.map(opt => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="number"
              size="small"
              label={formatMessage({
                id: 'ImportObservationsWizard.UploadStep.skipFirstRowsLabel'
              })}
              value={skipFirstRows}
              onChange={handleSkipFirstRowsChange}
              inputProps={{ min: 0, 'data-testid': 'skip-first-rows-input' }}
              sx={{ width: 200 }}
            />

            <TextField
              type="number"
              size="small"
              label={formatMessage({
                id: 'ImportObservationsWizard.UploadStep.skipLastRowsLabel'
              })}
              value={skipLastRows}
              onChange={handleSkipLastRowsChange}
              inputProps={{ min: 0, 'data-testid': 'skip-last-rows-input' }}
              sx={{ width: 200 }}
            />
          </Box>
        </>
      )}
      {/* File preview table */}
      {rawRows.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {formatMessage({
              id: 'ImportObservationsWizard.UploadStep.previewTitle'
            })}
          </Typography>
          <FilePreviewTable
            rawRows={rawRows}
            headerRow={headerRow === -1 ? -1 : headerRow}
            skipFirstRows={skipFirstRows}
            skipLastRows={skipLastRows}
          />
        </Box>
      )}
    </Box>
  );
};

export default UploadStep;
