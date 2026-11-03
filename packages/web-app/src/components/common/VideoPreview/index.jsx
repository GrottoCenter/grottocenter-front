import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import AppLink from '../AppLink';

const VideoPreview = ({ src, title, poster, isLightbox = false }) => {
  const { formatMessage } = useIntl();
  const videoRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !video.getAttribute('src')) video.setAttribute('src', src);
    return () => {
      if (!video) return;
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, hasError]);

  if (hasError) {
    return (
      <Box
        role="status"
        sx={{
          p: 2,
          textAlign: 'center',
          color: isLightbox ? 'white' : undefined
        }}>
        <Typography sx={{ mb: 1 }}>
          {formatMessage({ id: 'media.videoPlaybackError' })}
        </Typography>
        <AppLink href={src} sx={{ color: 'inherit' }}>
          {formatMessage({ id: 'media.openOriginal' })}
        </AppLink>
      </Box>
    );
  }

  return (
    <Box
      component="video"
      ref={videoRef}
      data-testid="video-preview"
      controls
      playsInline
      preload="metadata"
      src={src}
      poster={poster}
      aria-label={title}
      onError={() => setHasError(true)}
      sx={{
        width: '100%',
        maxHeight: isLightbox ? '100%' : { xs: 320, sm: 480, md: 600 },
        display: 'block',
        bgcolor: 'common.black',
        borderRadius: 0.5
      }}
    />
  );
};

VideoPreview.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  poster: PropTypes.string,
  isLightbox: PropTypes.bool
};

export default VideoPreview;
