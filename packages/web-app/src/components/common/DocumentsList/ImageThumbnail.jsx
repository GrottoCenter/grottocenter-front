import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardActionArea, Skeleton, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description } from '@mui/icons-material';

// Image count at which tiles stop sharing one card and get a tiling of their
// own. DocumentsList imports it to give those documents the full row, so the
// two layouts switch on the same number rather than on two literals.
export const GALLERY_MIN_IMAGES = 4;

// Every track is `1fr`: the container dictates thumbnail size, and height is
// bounded per consumer instead (see `maxHeight` below).
// - below the gallery threshold → exactly `count` columns sharing the width;
//   `auto-fill` sometimes fits only one track in narrow parents like
//   DocumentDetails' MainColumn.
// - at or above it → auto-fill tiling from a 240px floor, `1fr` absorbing the
//   leftover instead of stranding it at the right edge.
// Below `sm` everything collapses to a single column.
export const ThumbnailsGrid = styled(Box, {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $count }) => ({
  display: 'grid',
  gap: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns:
      $count < GALLERY_MIN_IMAGES
        ? `repeat(${$count}, minmax(0, 1fr))`
        : 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))'
  }
}));

// Guards the one case where filling the track backfires: a single column in a
// wide container would build a tower out of one photo. Past the cap the 4/3 box
// letterboxes and `object-fit: cover` crops.
const ThumbnailCard = styled(Card, {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $maxHeight }) => ({
  width: '100%',
  aspectRatio: '4 / 3',
  maxHeight: $maxHeight,
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

// A tile's rendered width depends on the container *and* on how many columns
// ThumbnailsGrid derives from the image count, so no call site can state it as
// a media query. `sizes="auto"` has the browser measure it instead — it needs
// `loading="lazy"`, which these images have. The rest is the fallback for
// engines without `auto` support.
const DEFAULT_SIZES = 'auto, (max-width: 599px) 100vw, 400px';

// Only engages in single-column layouts: a card in the documents grid is
// shorter than this at any sensible track width.
const DEFAULT_MAX_HEIGHT = 340;

const ImageThumbnail = ({
  src,
  srcSet,
  sizes = DEFAULT_SIZES,
  maxHeight = DEFAULT_MAX_HEIGHT,
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

  return (
    <ThumbnailCard onClick={onClick} $maxHeight={maxHeight}>
      <CardActionArea sx={{ height: '100%' }}>
        {error ? (
          <FallbackIconWrapper>
            <Description color="action" fontSize="large" />
          </FallbackIconWrapper>
        ) : (
          <>
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
          </>
        )}
      </CardActionArea>
    </ThumbnailCard>
  );
};

ImageThumbnail.propTypes = {
  src: PropTypes.string.isRequired,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  maxHeight: PropTypes.number,
  alt: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default ImageThumbnail;
