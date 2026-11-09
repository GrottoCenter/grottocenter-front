import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { FilePropTypes } from '@/types/document.type';
import { getThumbnailSources } from './utils/imageUtils';

// Key callers by file identity so a replacement resets its load-failure state.
const FileImage = ({
  file,
  alt,
  sizes,
  sx,
  onUnavailable,
  onLoad,
  loading = 'lazy'
}) => {
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const { src, srcSet } = getThumbnailSources(file);
  if (isUnavailable) return null;

  const handleError = () => {
    if (!hasThumbnailError && src !== file.completePath) {
      setHasThumbnailError(true);
    } else {
      setIsUnavailable(true);
      onUnavailable?.();
    }
  };

  return (
    <Box
      component="img"
      src={hasThumbnailError ? file.completePath : src}
      srcSet={hasThumbnailError ? undefined : srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      onError={handleError}
      sx={sx}
    />
  );
};

FileImage.propTypes = {
  file: FilePropTypes.isRequired,
  alt: PropTypes.string.isRequired,
  sizes: PropTypes.string.isRequired,
  sx: PropTypes.shape({}),
  onUnavailable: PropTypes.func,
  onLoad: PropTypes.func,
  loading: PropTypes.oneOf(['lazy', 'eager'])
};

export default FileImage;
