import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, ButtonBase } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import FileImage from '@/components/common/DocumentsList/FileImage';
import { FilePropTypes } from '@/types/document.type';

const FeaturedImage = ({ file, entranceName, onClick, onUnavailable }) => {
  const { formatMessage } = useIntl();
  const [aspectRatio, setAspectRatio] = useState(null);
  const isWide = aspectRatio > 1.5;
  // Above 4:1, the narrowest 96px frame cannot comfortably fit the badge.
  const shouldShowBadge = aspectRatio !== null && aspectRatio <= 4;

  return (
    <ButtonBase
      data-testid="entrance-featured-image"
      onClick={onClick}
      aria-label={formatMessage({ id: 'featuredImage.openGallery' })}
      sx={{
        position: 'relative',
        gridArea: 'photo',
        width: aspectRatio
          ? {
              xs: `min(100%, ${240 * aspectRatio}px)`,
              sm: `min(96px, ${144 * aspectRatio}px)`,
              md: `min(120px, ${144 * aspectRatio}px)`,
              lg: `min(128px, ${144 * aspectRatio}px)`
            }
          : { xs: '100%', sm: 96, md: 120, lg: 128 },
        ...(aspectRatio ? { aspectRatio } : { height: { xs: 180, sm: 144 } }),
        justifySelf: 'center',
        flexShrink: 0,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
        '&.Mui-focusVisible': {
          outline: '3px solid',
          outlineColor: 'primary.main'
        }
      }}>
      <FileImage
        file={file}
        alt={entranceName}
        sizes="(max-width: 599px) 100vw, 128px"
        loading="eager"
        onLoad={({ currentTarget }) => {
          if (currentTarget.naturalWidth && currentTarget.naturalHeight) {
            setAspectRatio(
              currentTarget.naturalWidth / currentTarget.naturalHeight
            );
          }
        }}
        onUnavailable={onUnavailable}
        sx={{
          display: 'block',
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          objectFit: 'contain'
        }}
      />
      {shouldShowBadge && (
        <Box
          data-testid="entrance-featured-image-badge"
          sx={{
            position: 'absolute',
            bottom: theme => theme.spacing(isWide ? 0.5 : 1),
            right: theme => theme.spacing(isWide ? 0.5 : 1),
            display: 'flex',
            p: isWide ? 0.25 : 0.5,
            borderRadius: 1,
            bgcolor: 'rgba(0,0,0,0.55)',
            color: 'common.white'
          }}>
          <Visibility sx={{ fontSize: isWide ? 14 : 20 }} />
        </Box>
      )}
    </ButtonBase>
  );
};

FeaturedImage.propTypes = {
  file: FilePropTypes.isRequired,
  entranceName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onUnavailable: PropTypes.func.isRequired
};

export default FeaturedImage;
