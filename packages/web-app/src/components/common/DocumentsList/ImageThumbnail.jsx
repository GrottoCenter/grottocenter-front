import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardActionArea, Skeleton, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description } from '@mui/icons-material';

// The track layout scales with the image count so a lone image doesn't stretch
// full-width and a large gallery still tiles densely. Below `sm` everything
// collapses to a single column.
//
// - 1 image  → capped single column
// - 2-3 images → exactly `count` columns (avoids `auto-fill` sometimes only
//   fitting 1 track in narrow parents like DocumentDetails' MainColumn)
// - 4+ images → auto-fill dense grid
export const ThumbnailsGrid = styled(Box, {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $count }) => {
  let gridTemplateColumns;
  if ($count <= 1) gridTemplateColumns = 'minmax(0, 400px)';
  else if ($count <= 3)
    gridTemplateColumns = `repeat(${$count}, minmax(0, 400px))`;
  else gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 260px))';
  return {
    display: 'grid',
    gap: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      gridTemplateColumns,
      justifyContent: 'start'
    }
  };
});

const ThumbnailCard = styled(Card)(({ theme }) => ({
  width: '100%',
  aspectRatio: '4 / 3',
  cursor: 'pointer',
  transition: 'box-shadow 0.3s ease',
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

// Thumbnails now stretch inside a CSS-Grid track (`minmax(270px, 1fr)`); on desktop
// a single track can grow well past 270px on wide containers, so overshoot a bit
// to let the browser pick the higher-res srcSet variant instead of upscaling.
const DEFAULT_SIZES = '(max-width: 599px) 100vw, 400px';

const ImageThumbnail = ({
  src,
  srcSet,
  sizes = DEFAULT_SIZES,
  alt,
  onClick
}) => {
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
          srcSet={srcSet}
          sizes={sizes}
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
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  alt: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default ImageThumbnail;
