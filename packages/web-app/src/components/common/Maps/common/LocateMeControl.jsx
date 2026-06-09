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

const LocateMeControl = ({ onClick, loading, error }) => {
  const { formatMessage } = useIntl();

  return (
    <CustomControl position="topleft" useLeafletControl>
      <Tooltip
        title={
          error
            ? formatMessage({ id: LOCATE_ERRORS[error] })
            : formatMessage({ id: 'Use my location' })
        }
        open={error ? true : undefined}
        placement="right"
        arrow>
        <span>
          <IconButton
            size="small"
            onClick={onClick}
            disabled={loading}
            sx={{
              bgcolor: error ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              color: error ? 'white' : 'text.primary',
              height: 30,
              width: 30,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' },
              '&.Mui-disabled': { bgcolor: 'background.paper', opacity: 0.6 }
            }}>
            {loading
              ? <CircularProgress size={14} color="inherit" />
              : <MyLocationIcon sx={{ fontSize: 16 }} />}
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
