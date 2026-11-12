import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Slider,
  Switch,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Cropper from 'react-easy-crop';
import { createAvatarFile } from '@/utils/avatarImage';
import { useMeasuredWidth } from '@/hooks';
import StandardDialog from '../StandardDialog';

const AvatarCropDialog = ({
  imageUrl,
  isOrganization,
  isPending,
  isOnline,
  error,
  onSave,
  onClose
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(isOrganization ? 0.9 : 1);
  const [cropAreaRef, cropAreaWidth] = useMeasuredWidth();
  const cropSize = useMemo(() => {
    if (!isOrganization || !cropAreaWidth) return undefined;
    const side = Math.round(cropAreaWidth * 0.9);
    return { width: side, height: side };
  }, [isOrganization, cropAreaWidth]);
  const [cropPixels, setCropPixels] = useState(null);
  const [shouldContain, setShouldContain] = useState(isOrganization);
  const [isPreparing, setIsPreparing] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const isBusy = isPreparing || isPending;

  const handleSave = async () => {
    if (isBusy || !isOnline) return;
    setIsPreparing(true);
    setHasImageError(false);
    try {
      const file = await createAvatarFile(imageUrl, cropPixels, shouldContain);
      await onSave(file);
    } catch {
      // API failures are retained by the editor; decoding failures are local.
      setHasImageError(true);
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <StandardDialog
      open
      fullWidth
      fullScreen={isMobile}
      scrollable
      stackActionsOnMobile
      title={formatMessage({
        id: isOrganization ? 'avatar.editLogo' : 'avatar.editPhoto'
      })}
      onClose={isBusy ? null : onClose}
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isBusy}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isBusy || !isOnline || (!shouldContain && !cropPixels)}
            data-testid="avatar-save"
            startIcon={isBusy ? <CircularProgress size={18} /> : null}>
            {formatMessage({ id: 'avatar.save' })}
          </Button>
        </>
      }>
      {!shouldContain && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatMessage({ id: 'avatar.cropHelp' })}
        </Typography>
      )}
      <Box
        ref={cropAreaRef}
        data-testid="avatar-crop-area"
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 320,
          aspectRatio: '1',
          mx: 'auto',
          bgcolor: isOrganization ? 'background.paper' : 'grey.900',
          overflow: 'hidden',
          borderRadius: 1,
          '& .avatar-crop-focus:focus-visible': {
            outline: '3px solid',
            outlineColor: isOrganization ? 'primary.main' : 'common.white',
            outlineOffset: 3
          }
        }}>
        {shouldContain ? (
          <Box
            component="img"
            src={imageUrl}
            alt={formatMessage({ id: 'avatar.preview' })}
            sx={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              bgcolor: 'background.paper'
            }}
          />
        ) : (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropSize={cropSize}
            minZoom={isOrganization ? 0.5 : 1}
            restrictPosition={!isOrganization}
            cropShape={isOrganization ? 'rect' : 'round'}
            showGrid={false}
            zoomWithScroll={false}
            style={{
              containerStyle: { pointerEvents: isBusy ? 'none' : 'auto' }
            }}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => setCropPixels(pixels)}
            keyboardStep={10}
            classes={{ cropAreaClassName: 'avatar-crop-focus' }}
            cropperProps={{
              'aria-label': formatMessage({ id: 'avatar.cropHelp' }),
              role: 'group',
              tabIndex: isBusy ? -1 : 0
            }}
          />
        )}
      </Box>
      {isOrganization && (
        <FormControlLabel
          control={
            <Switch
              checked={shouldContain}
              onChange={(_event, checked) => setShouldContain(checked)}
              disabled={isBusy}
            />
          }
          label={formatMessage({ id: 'avatar.contain' })}
          sx={{ mt: 1 }}
        />
      )}
      {!shouldContain && (
        <Box sx={{ mt: 2, px: 1 }}>
          <Typography id="avatar-zoom-label" variant="body2">
            {formatMessage({ id: 'avatar.zoom' })}
          </Typography>
          <Slider
            aria-labelledby="avatar-zoom-label"
            min={isOrganization ? 0.5 : 1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(_event, value) => setZoom(value)}
            disabled={isBusy}
          />
        </Box>
      )}
      {(error || hasImageError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error || formatMessage({ id: 'avatar.invalidImage' })}
        </Alert>
      )}
      {!isOnline && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {formatMessage({ id: 'avatar.offline' })}
        </Alert>
      )}
    </StandardDialog>
  );
};

AvatarCropDialog.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  isOrganization: PropTypes.bool.isRequired,
  isPending: PropTypes.bool.isRequired,
  isOnline: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AvatarCropDialog;
