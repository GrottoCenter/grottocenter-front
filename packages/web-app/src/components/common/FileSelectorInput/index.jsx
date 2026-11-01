import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { ErrorCode, useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SelectedFile from './SelectedFile';

// Internal, stable rejection reasons. These values intentionally differ from
// react-dropzone's code enum; DROPZONE_REJECTION_MAP owns that boundary.
export const REJECTION_REASONS = Object.freeze({
  TOO_LARGE: 'file-too-large',
  TOO_SMALL: 'file-too-small',
  TYPE_NOT_ACCEPTED: 'file-type-not-accepted',
  TOO_MANY_FILES: 'too-many-files',
  UNKNOWN: 'unknown'
});

const DROPZONE_REJECTION_MAP = {
  'file-too-large': REJECTION_REASONS.TOO_LARGE,
  'file-too-small': REJECTION_REASONS.TOO_SMALL,
  'file-invalid-type': REJECTION_REASONS.TYPE_NOT_ACCEPTED,
  'too-many-files': REJECTION_REASONS.TOO_MANY_FILES
};

// react-dropzone expects `accept` as `{ mimeType: string[] }`. Historical
// callers passed a comma-separated string of MIME types and `.ext` entries
// (matching the plain `<input accept="…">` attribute). Normalize that string
// into the object form: valid MIME types become empty-array keys, and every
// `.ext` gets attached to `application/octet-stream` — a catch-all that keeps
// the extension check active without constraining `file.type` (attr-accept
// treats each key/value token independently on drop).
const normalizeAccept = accept => {
  if (!accept) return undefined;
  if (typeof accept !== 'string') return accept;
  const parts = accept
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  const result = {};
  const extensions = [];
  for (const part of parts) {
    if (part.startsWith('.')) extensions.push(part);
    else if (!result[part]) result[part] = [];
  }
  if (extensions.length > 0) {
    result['application/octet-stream'] = [
      ...(result['application/octet-stream'] ?? []),
      ...extensions
    ];
  }
  return result;
};

const normalizeRejections = fileRejections =>
  fileRejections.map(({ file, errors }) => ({
    file,
    fileName: file?.name ?? '',
    reasons: errors.map(
      e => DROPZONE_REJECTION_MAP[e.code] ?? REJECTION_REASONS.UNKNOWN
    )
  }));

// Pull `.ext` tokens out of a normalized accept object so the hint label stays
// truthful when the caller doesn't hand-roll an `extensions` prop.
const deriveExtensionsFromAccept = acceptObject => {
  if (!acceptObject || typeof acceptObject !== 'object') return [];
  const seen = new Set();
  for (const values of Object.values(acceptObject)) {
    if (!Array.isArray(values)) continue;
    for (const entry of values) {
      if (typeof entry === 'string' && entry.startsWith('.')) seen.add(entry);
    }
  }
  return [...seen];
};

const DropZone = styled(Box, {
  shouldForwardProp: p =>
    p !== '$isDragging' && p !== '$isDragAccept' && p !== '$isDragReject'
})(({ theme, $isDragging, $isDragAccept, $isDragReject }) => {
  let borderColor = theme.palette.divider;
  let background = 'transparent';
  if ($isDragReject) {
    borderColor = theme.palette.error.main;
    background = theme.palette.action.hover;
  } else if ($isDragAccept) {
    borderColor = theme.palette.success.main;
    background = theme.palette.action.hover;
  } else if ($isDragging) {
    borderColor = theme.palette.primary.main;
    background = theme.palette.action.hover;
  }
  return {
    border: `2px dashed ${borderColor}`,
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(3, 1),
    textAlign: 'center',
    cursor: 'pointer',
    background,
    transition: 'border-color 0.2s, background 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      background: theme.palette.action.hover
    }
  };
});

const FileSelectorInput = ({
  files = [],
  onFilesAdd,
  onFileRemove,
  onFileRejections,
  accept,
  extensions,
  disabled = false,
  multiple = true,
  maxSize,
  maxFiles,
  renderFileDetails
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const t = (pluralId, singularId) =>
    formatMessage({ id: multiple ? pluralId : singularId });

  const acceptObject = useMemo(() => normalizeAccept(accept), [accept]);
  // Prefer the caller's explicit `extensions` (it may include display-only
  // entries that don't map to a single accept key); fall back to what the
  // normalized accept object actually filters on so the hint can't drift.
  const displayedExtensions = useMemo(
    () =>
      extensions && extensions.length > 0
        ? extensions
        : deriveExtensionsFromAccept(acceptObject),
    [extensions, acceptObject]
  );
  // When `multiple` is false, cap at a single file. Otherwise honour the
  // caller's explicit maxFiles, or leave it unbounded (react-dropzone reads
  // `0` as "no limit").
  const effectiveMaxFiles = multiple ? (maxFiles ?? 0) : 1;

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    accept: acceptObject,
    disabled,
    multiple,
    maxSize,
    maxFiles: effectiveMaxFiles,
    // Clipboard ingestion stays off — the issue explicitly excludes it, and the
    // browser's picker is the only intake path we support besides drag/drop.
    noPaste: true,
    onDrop: (acceptedFiles, fileRejections) => {
      // Dropzone 19+ accepts the in-limit files from an oversized batch.
      // Keep our all-or-nothing limit so import forms cannot start parsing
      // one file while also handling a rejection from the same drop.
      const hasOverflow = fileRejections.some(({ errors }) =>
        errors.some(({ code }) => code === ErrorCode.TooManyFiles)
      );
      if (hasOverflow) {
        const rejectedAcceptedFiles = acceptedFiles.map(file => ({
          file,
          errors: [{ code: ErrorCode.TooManyFiles }]
        }));
        onFileRejections?.(
          normalizeRejections([...rejectedAcceptedFiles, ...fileRejections])
        );
        return;
      }
      if (acceptedFiles.length > 0) onFilesAdd(acceptedFiles);
      if (fileRejections.length > 0 && onFileRejections)
        onFileRejections(normalizeRejections(fileRejections));
    }
  });

  const areExtensionsCollapsible = isMobile && displayedExtensions.length > 3;
  const extensionsList = displayedExtensions.length > 0 && (
    <Typography
      component="div"
      variant="caption"
      onClick={event => event.stopPropagation()}
      sx={{
        color: 'text.secondary',
        display: 'block'
      }}>
      {[...displayedExtensions].sort().join(', ')}
    </Typography>
  );
  const extensionsLabel = areExtensionsCollapsible ? (
    <Box component="details" sx={{ mt: 0.5 }}>
      <Typography
        component="summary"
        variant="caption"
        data-testid="accepted-formats-toggle"
        sx={{
          display: 'list-item',
          width: 'fit-content',
          color: 'text.secondary',
          cursor: 'pointer',
          py: 0.5,
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
            borderRadius: 0.5
          }
        }}>
        {formatMessage({ id: 'fileSelector.acceptedFormats' })}
      </Typography>
      {extensionsList}
    </Box>
  ) : (
    extensionsList
  );

  const selectedFiles = files.length > 0 && (
    <Box
      component="ul"
      data-testid="selected-files"
      sx={{
        listStyle: 'none',
        display: 'grid',
        gap: 1.5,
        width: '100%',
        maxWidth: theme.spacing(112),
        p: 0,
        m: 0,
        mt: 1.5
      }}>
      {files.map(f => (
        <SelectedFile
          key={f.id ?? f.fileName}
          file={f}
          onRemove={onFileRemove}
          disabled={disabled}
          renderFileDetails={renderFileDetails}
        />
      ))}
    </Box>
  );

  // getInputProps() renders react-dropzone's own <input type="file"/>, which
  // preserves the native picker across browsers (the File System Access API
  // path is bypassed by useDropzone when the ref-less input is present).
  const inputEl = <input {...getInputProps()} />;

  if (isMobile) {
    // The touch layout is picker-only, so it intentionally omits drop handlers.
    return (
      <Stack>
        {inputEl}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<CloudUploadIcon />}
          disabled={disabled}
          onClick={open}
          type="button"
          data-testid="file-picker"
          sx={{ textTransform: 'uppercase', minHeight: 48 }}>
          {t('fileSelector.addFiles', 'fileSelector.addFile')}
        </Button>
        {extensionsLabel}
        {selectedFiles}
      </Stack>
    );
  }

  const rootProps = getRootProps({
    role: 'button',
    'data-testid': 'file-dropzone',
    'aria-label': t(
      'Drop files here or click to select',
      'Drop a file here or click to select'
    ),
    'aria-disabled': disabled
  });

  return (
    <Stack>
      <DropZone
        {...rootProps}
        $isDragging={isDragActive}
        $isDragAccept={isDragAccept}
        $isDragReject={isDragReject}
        data-testid="file-dropzone">
        {inputEl}
        <CloudUploadIcon
          sx={{
            fontSize: 40,
            color: isDragActive ? 'primary.main' : 'text.disabled',
            mb: 0.5
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: isDragActive ? 'primary.main' : 'text.secondary',
            fontWeight: 500
          }}>
          {t('Drag and drop files here', 'Drag and drop a file here')}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            display: 'block'
          }}>
          {formatMessage({ id: 'or' })}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          type="button"
          sx={{ mt: 0.5, pointerEvents: 'none', textTransform: 'none' }}>
          {t('Choose files', 'Choose a file')}
        </Button>
        {extensionsList}
      </DropZone>
      {selectedFiles}
    </Stack>
  );
};

FileSelectorInput.propTypes = {
  extensions: PropTypes.arrayOf(PropTypes.string),
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string,
      file: PropTypes.instanceOf(File)
    })
  ),
  onFilesAdd: PropTypes.func.isRequired,
  onFileRemove: PropTypes.func,
  onFileRejections: PropTypes.func,
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string))
  ]),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  maxFiles: PropTypes.number,
  renderFileDetails: PropTypes.func
};

export default FileSelectorInput;
