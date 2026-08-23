import { useContext, useEffect, useRef, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import { useIntl } from 'react-intl';
import { Box, Typography } from '@mui/material';
import Alert from '../../../common/Alert';
import FileSelectorInput, {
  REJECTION_REASONS
} from '../../../common/FileSelectorInput';
import { ImportPageContentContext } from '../Provider';
import checkData from '../checkData';

const ACCEPT = { 'text/csv': ['.csv'] };
const EXTENSIONS = ['.csv'];

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const Step2 = () => {
  const { updateAttribute, selectedType, importSession } = useContext(
    ImportPageContentContext
  );
  const { reset: resetImportSession } = importSession;
  const { formatMessage } = useIntl();
  const { readString } = usePapaParse();

  const [rowErrors, setRowErrors] = useState([]);
  const [rejectionError, setRejectionError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const parseGenerationRef = useRef(0);

  const resetCurrentImport = () => {
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
    resetImportSession();
  };

  // Clear any residual import state whenever the step mounts, so a batchId /
  // progress / result from a previous run does not leak into the next one.
  useEffect(() => {
    updateAttribute('importData', undefined);
    updateAttribute('fileImported', false);
    resetImportSession();
    // Both callbacks have stable identities, so this remains a mount-only
    // reset without suppressing the exhaustive-deps check.
  }, [updateAttribute, resetImportSession]);

  const clearImportedFile = () => {
    parseGenerationRef.current += 1;
    setSelectedFile(null);
    setRowErrors([]);
    resetCurrentImport();
  };

  const parseFile = async file => {
    const parseGeneration = parseGenerationRef.current + 1;
    parseGenerationRef.current = parseGeneration;
    setRejectionError(null);
    setRowErrors([]);
    resetCurrentImport();
    const text = await file.text();
    if (parseGeneration !== parseGenerationRef.current) return;
    readString(text, {
      transformHeader: header => header.trim(),
      header: true,
      skipEmptyLines: true,
      complete: results => {
        if (parseGeneration !== parseGenerationRef.current) return;
        const errors = [
          ...results.errors.map(e => ({
            errorMessage: `Import error ${e.message}`,
            row: e.row + 2
          })),
          ...checkData(results.data, selectedType, formatMessage)
        ];
        const isValid = errors.length === 0;
        // Commit the visible file and its parsed data under the same guard
        // above.
        setSelectedFile(file);
        setRowErrors(errors);
        updateAttribute('importData', isValid ? results.data : undefined);
        updateAttribute('fileImported', isValid);
      }
    });
  };

  const handleFileRejections = rejections => {
    const [rejection] = rejections;
    if (!rejection) return;
    parseGenerationRef.current += 1;
    setSelectedFile(null);
    setRowErrors([]);
    resetCurrentImport();
    const messageId = rejection.reasons.includes(
      REJECTION_REASONS.TYPE_NOT_ACCEPTED
    )
      ? 'Only CSV files are accepted.'
      : 'This file was rejected.';
    setRejectionError(
      formatMessage({ id: messageId, defaultMessage: messageId })
    );
  };

  const files = selectedFile
    ? [{ fileName: selectedFile.name, file: selectedFile }]
    : [];

  return (
    <>
      <FileSelectorInput
        files={files}
        multiple={false}
        maxFiles={1}
        accept={ACCEPT}
        extensions={EXTENSIONS}
        onFilesAdd={([file]) => file && parseFile(file)}
        onFileRemove={clearImportedFile}
        onFileRejections={handleFileRejections}
      />
      {selectedFile && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {formatBytes(selectedFile.size)}
          </Typography>
        </Box>
      )}
      {rejectionError && <Alert content={rejectionError} severity="error" />}
      {rowErrors.map(err => (
        <Alert
          content={`${formatMessage({ id: 'Row' })} ${err.row} : ${err.errorMessage}`}
          key={err.row + err.errorMessage}
          severity="error"
        />
      ))}
    </>
  );
};

export default Step2;
