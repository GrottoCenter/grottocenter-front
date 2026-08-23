import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Internal, stable rejection reasons. The values are picked to be
// self-descriptive so callers can render them or map them to i18n keys without
// leaking react-dropzone's own code enums into feature code.
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
  maxFiles
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const t = (pluralId, singularId) =>
    formatMessage({ id: multiple ? pluralId : singularId });

  const acceptObject = useMemo(() => normalizeAccept(accept), [accept]);
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
      if (acceptedFiles.length > 0) onFilesAdd(acceptedFiles);
      if (fileRejections.length > 0 && onFileRejections)
        onFileRejections(normalizeRejections(fileRejections));
    }
  });

  const extensionsLabel = extensions?.length > 0 && (
    <Typography
      variant="caption"
      color="text.disabled"
      display="block"
      onClick={e => e.stopPropagation()}>
      {[...extensions].sort().join(', ')}
    </Typography>
  );

  const fileChips = files.length > 0 && (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={0.5}
      mt={1}
      onClick={e => e.stopPropagation()}>
      {files.map(f => (
        <Chip
          key={f.fileName}
          label={f.fileName}
          size="small"
          color="primary"
          onDelete={onFileRemove ? () => onFileRemove(f.fileName) : undefined}
        />
      ))}
    </Box>
  );

  // getInputProps() renders react-dropzone's own <input type="file"/>, which
  // preserves the native picker across browsers (the File System Access API
  // path is bypassed by useDropzone when the ref-less input is present).
  const inputEl = <input {...getInputProps()} />;

  if (isMobile) {
    return (
      <Stack>
        {inputEl}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<CloudUploadIcon />}
          disabled={disabled}
          onClick={open}>
          {t('Upload files', 'Upload a file')}
        </Button>
        {extensionsLabel}
        {fileChips}
      </Stack>
    );
  }

  const rootProps = getRootProps({
    role: 'button',
    'aria-label': t(
      'Drop files here or click to select',
      'Drop a file here or click to select'
    ),
    'aria-disabled': disabled
  });

  return (
    <DropZone
      {...rootProps}
      $isDragging={isDragActive}
      $isDragAccept={isDragAccept}
      $isDragReject={isDragReject}>
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
        color={isDragActive ? 'primary' : 'text.secondary'}
        fontWeight={500}>
        {t('Drag and drop files here', 'Drag and drop a file here')}
      </Typography>
      <Typography variant="caption" color="text.disabled" display="block">
        {formatMessage({ id: 'or' })}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        sx={{ mt: 0.5, pointerEvents: 'none' }}>
        {t('Choose files', 'Choose a file')}
      </Button>
      {extensionsLabel}
      {fileChips}
    </DropZone>
  );
};

FileSelectorInput.propTypes = {
  extensions: PropTypes.arrayOf(PropTypes.string),
  files: PropTypes.arrayOf(
    PropTypes.shape({ fileName: PropTypes.string.isRequired })
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
  maxFiles: PropTypes.number
};

export default FileSelectorInput;
