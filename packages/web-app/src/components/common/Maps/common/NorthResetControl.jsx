import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import CustomControl from './CustomControl';
import CompassNeedle from './CompassNeedle';

// Floating north button, stacked above the location control by LocationControl
// (the sole source of map rotation). Shown whenever the map is left rotated:
// either actively, while heading-up compass follow rotates it (tap exits
// compass), or frozen after a drag detached tracking from compass mode (tap
// just straightens the map).
const NorthResetControl = ({ bearing, onClick }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const label = formatMessage({ id: 'Reset to north' });

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip title={label} placement="left" arrow>
        <IconButton
          size="small"
          onClick={onClick}
          aria-label={label}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '4px',
            height: 44,
            width: 44,
            '&:hover': { bgcolor: '#f4f4f4' }
          }}>
          <CompassNeedle
            bearing={bearing}
            northColor={theme.palette.error.main}
            southColor={theme.palette.grey[500]}
          />
        </IconButton>
      </Tooltip>
    </CustomControl>
  );
};

NorthResetControl.propTypes = {
  bearing: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};

export default NorthResetControl;
