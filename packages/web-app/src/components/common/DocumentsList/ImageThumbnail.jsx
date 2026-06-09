import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardActionArea, Skeleton, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description } from '@mui/icons-material';

const ThumbnailCard = styled(Card)(({ theme }) => ({
  width: '100%',
  aspectRatio: '4 / 3',
  cursor: 'pointer',
  transition: 'box-shadow 0.3s ease',
  [theme.breakpoints.up('sm')]: {
    width: 240,
    height: 180,
    aspectRatio: 'auto'
  },
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const ThumbnailImage = styled('img')`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const FallbackIconWrapper = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.grey[200]};
  border-radius: 4px;
`;

const ImageThumbnail = ({ src, alt, onClick }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <ThumbnailCard onClick={onClick}>
        <CardActionArea sx={{ height: '100%' }}>
          <FallbackIconWrapper>
            <Description color="action" fontSize="large" />
          </FallbackIconWrapper>
        </CardActionArea>
      </ThumbnailCard>
    );
  }

  return (
    <ThumbnailCard onClick={onClick}>
      <CardActionArea sx={{ height: '100%' }}>
        {loading && (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="wave"
            sx={{ position: 'absolute', inset: 0 }}
          />
        )}
        <ThumbnailImage
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s' }}
        />
      </CardActionArea>
    </ThumbnailCard>
  );
};

ImageThumbnail.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default ImageThumbnail;
