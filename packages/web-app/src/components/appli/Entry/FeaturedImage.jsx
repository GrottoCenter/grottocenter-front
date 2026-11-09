import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, ButtonBase } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import FileImage from '@/components/common/DocumentsList/FileImage';
import { FilePropTypes } from '@/types/document.type';

const FeaturedImage = ({ file, entranceName, onClick, onUnavailable }) => {
  const { formatMessage } = useIntl();
  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <ButtonBase
      data-testid="entrance-featured-image"
      onClick={onClick}
      aria-label={formatMessage({ id: 'featuredImage.openGallery' })}
      sx={{
        position: 'relative',
        gridArea: 'photo',
        width: {
          xs: `min(100%, ${240 * aspectRatio}px)`,
          sm: `min(96px, ${144 * aspectRatio}px)`,
          md: `min(120px, ${144 * aspectRatio}px)`,
          lg: `min(128px, ${144 * aspectRatio}px)`
        },
        aspectRatio,
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
      <Box
        sx={{
          position: 'absolute',
          bottom: theme => theme.spacing(1),
          right: theme => theme.spacing(1),
          display: 'flex',
          p: 0.5,
          borderRadius: 1,
          bgcolor: 'rgba(0,0,0,0.55)',
          color: 'common.white'
        }}>
        <Visibility fontSize="small" />
      </Box>
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
