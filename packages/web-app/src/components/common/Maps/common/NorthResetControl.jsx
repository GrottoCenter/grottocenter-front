import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import CustomControl from './CustomControl';
import CompassNeedle from './CompassNeedle';

// Floating north button, rendered by LocationControl (the sole source of map
// rotation). Shown whenever the map is left rotated: either actively, while
// heading-up compass follow rotates it (tap exits compass), or frozen after a
// drag detached tracking from compass mode (tap just straightens the map).
//
// Round and in the top-right corner rather than square in the bottom-right
// stack: it reports the map's orientation instead of acting on the location,
// and the navigation-app convention for that is a floating compass badge.
// `containerClassName` drops Leaflet's `leaflet-bar` frame, which would draw a
// square border around the circle.
const NorthResetControl = ({ bearing, onClick }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const label = formatMessage({ id: 'Reset to north' });

  return (
    <CustomControl
      position="topright"
      containerClassName="leaflet-control"
      useLeafletControl>
      <Tooltip title={label} placement="left" arrow>
        <IconButton
          onClick={onClick}
          aria-label={label}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '50%',
            boxShadow: 2,
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
