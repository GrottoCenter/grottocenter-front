import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
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

const DropZone = styled(Box, {
  shouldForwardProp: p => p !== '$isDragging'
})(({ theme, $isDragging }) => ({
  border: `2px dashed ${
    $isDragging ? theme.palette.primary.main : theme.palette.divider
  }`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4, 2),
  textAlign: 'center',
  cursor: 'pointer',
  background: $isDragging ? theme.palette.action.hover : 'transparent',
  transition: 'border-color 0.2s, background 0.2s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    background: theme.palette.action.hover
  }
}));

const FileSelectorInput = ({
  files = [],
  onFilesAdd,
  onFileRemove,
  accept,
  extensions,
  disabled = false
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const inputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = e => {
    onFilesAdd(e.target.files);
    e.target.value = '';
  };

  const handleDragEnter = e => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };
  const handleDragLeave = e => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = e => e.preventDefault();
  const handleDrop = e => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current = 0;
    setIsDragging(false);
    onFilesAdd(e.dataTransfer.files);
  };

  const extensionsLabel = extensions?.length > 0 && (
    <Typography
      variant="caption"
      color="text.disabled"
      display="block"
      mt={1.5}
      onClick={e => e.stopPropagation()}>
      {[...extensions].sort().join(', ')}
    </Typography>
  );

  const fileChips = files.length > 0 && (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={1}
      mt={2}
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

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
      />
      {isMobile ? (
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<CloudUploadIcon />}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}>
            {formatMessage({ id: 'Upload files' })}
          </Button>
          {extensionsLabel}
          {fileChips}
        </Stack>
      ) : (
        <DropZone
          $isDragging={isDragging}
          role="button"
          tabIndex={0}
          aria-label={formatMessage({ id: 'Drop files here or click to select' })}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled)
              inputRef.current?.click();
          }}>
          <CloudUploadIcon
            sx={{
              fontSize: 40,
              color: isDragging ? 'primary.main' : 'text.disabled',
              mb: 1
            }}
          />
          <Typography
            variant="body2"
            color={isDragging ? 'primary' : 'text.secondary'}
            fontWeight={500}>
            {formatMessage({ id: 'Drag and drop files here' })}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            mt={0.5}
            display="block">
            {formatMessage({ id: 'or' })}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
            sx={{ mt: 1, pointerEvents: 'none' }}>
            {formatMessage({ id: 'Choose files' })}
          </Button>
          {extensionsLabel}
          {fileChips}
        </DropZone>
      )}
    </>
  );
};

FileSelectorInput.propTypes = {
  extensions: PropTypes.arrayOf(PropTypes.string),
  files: PropTypes.arrayOf(
    PropTypes.shape({ fileName: PropTypes.string.isRequired })
  ),
  onFilesAdd: PropTypes.func.isRequired,
  onFileRemove: PropTypes.func,
  accept: PropTypes.string,
  disabled: PropTypes.bool
};

export default FileSelectorInput;
