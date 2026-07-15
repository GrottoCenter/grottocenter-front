import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CustomControl from './CustomControl';

const LOCATE_ERRORS = {
  1: 'Location access denied. Enable it in your browser settings.',
  2: 'Your position could not be determined.',
  3: 'Location request timed out. Please try again.'
};

const LocateMeControl = ({ onClick, loading = false, error = null }) => {
  const { formatMessage } = useIntl();

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip
        title={
          error
            ? formatMessage({ id: LOCATE_ERRORS[error] })
            : formatMessage({ id: 'Use my location' })
        }
        open={error ? true : undefined}
        placement="left"
        arrow>
        <span>
          <IconButton
            onClick={onClick}
            disabled={loading}
            sx={{
              bgcolor: error ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              color: error ? 'white' : 'mapControlIcon',
              height: 44,
              width: 44,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' },
              '&.Mui-disabled': { bgcolor: 'background.paper', opacity: 0.6 }
            }}>
            {loading
              ? <CircularProgress size={20} color="inherit" />
              : <MyLocationIcon sx={{ fontSize: 28 }} />}
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

LocateMeControl.propTypes = {
  error: PropTypes.number,
  loading: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default LocateMeControl;
