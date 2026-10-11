import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import StopIcon from '@mui/icons-material/Stop';
import CustomControl from './CustomControl';
import useMapOverlayContainer from './useMapOverlayContainer';

export const LOCATE_ERRORS = {
  1: 'Location access denied. Enable it in your browser settings.',
  2: 'Your position could not be determined.',
  3: 'Location request timed out. Please try again.'
};

const LocateMeControl = ({
  onClick,
  loading = false,
  error = null,
  retry = false
}) => {
  const { formatMessage } = useIntl();
  const overlayContainer = useMapOverlayContainer();
  let labelId = 'Use my location';
  if (loading) labelId = 'location.acquisition.stop';
  else if (retry) labelId = 'location.acquisition.retry';
  const label = formatMessage({ id: labelId });

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip
        title={error ? formatMessage({ id: LOCATE_ERRORS[error] }) : label}
        placement="left"
        slotProps={{ popper: { container: overlayContainer } }}
        arrow>
        <span>
          <IconButton
            aria-label={label}
            data-testid="locate-me"
            onClick={onClick}
            sx={{
              bgcolor: error ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              color: error ? 'white' : 'mapControlIcon',
              height: 44,
              width: 44,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' },
              '&.Mui-disabled': { bgcolor: 'background.paper', opacity: 0.6 }
            }}>
            {loading ? (
              <StopIcon sx={{ fontSize: 28 }} />
            ) : (
              <MyLocationIcon sx={{ fontSize: 28 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

LocateMeControl.propTypes = {
  error: PropTypes.number,
  loading: PropTypes.bool,
  retry: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default LocateMeControl;
