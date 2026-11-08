import PropTypes from 'prop-types';
import { Box, ButtonBase } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';
import FileImage from '@/components/common/DocumentsList/FileImage';
import { FilePropTypes } from '@/types/document.type';

const FeaturedImage = ({ file, entranceName, onClick, onUnavailable }) => {
  const { formatMessage } = useIntl();

  return (
    <ButtonBase
      data-testid="entrance-featured-image"
      onClick={onClick}
      aria-label={formatMessage({ id: 'featuredImage.openGallery' })}
      sx={{
        position: 'relative',
        gridArea: 'photo',
        width: { xs: '100%', sm: 96, md: 120, lg: 128 },
        height: { xs: 180, sm: 144 },
        flexShrink: 0,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'grey.100',
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
        onUnavailable={onUnavailable}
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
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
