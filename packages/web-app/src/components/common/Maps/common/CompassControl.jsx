import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import { useMap } from 'react-leaflet';
import useDeviceOrientation from '../../../../hooks/useDeviceOrientation';
import CustomControl from './CustomControl';

// Rotate the map so that the direction the device is facing points up.
// leaflet-rotate's bearing is the clockwise angle applied to the map, so the
// map must be turned by the opposite of the compass heading.
const headingToBearing = heading => -heading;

// Two-tone compass needle: the red tip points to true North. It is rotated by
// the current map bearing so it keeps indicating North on the rotated map.
const CompassNeedle = ({ bearing }) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{
      transform: `rotate(${bearing}deg)`,
      transition: 'transform 0.15s linear'
    }}>
    <polygon points="12,1 17,12 7,12" fill="#e53935" />
    <polygon points="12,23 17,12 7,12" fill="#9e9e9e" />
  </svg>
);

CompassNeedle.propTypes = {
  bearing: PropTypes.number.isRequired
};

const ERROR_MESSAGES = {
  denied: 'Compass access denied. Enable it in your browser settings.',
  unavailable: 'No compass available on this device.'
};

const CompassControl = () => {
  const { formatMessage } = useIntl();
  const map = useMap();
  const { heading, isSupported, error, start, stop } = useDeviceOrientation();
  const [active, setActive] = useState(false);

  // Follow the compass heading while active.
  useEffect(() => {
    if (!active || heading === null) return;
    map.setBearing(headingToBearing(heading));
  }, [active, heading, map]);

  // Any error (permission denied or no sensor) cancels the follow mode and
  // restores a north-up map.
  useEffect(() => {
    if (error && active) {
      setActive(false);
      map.setBearing(0);
    }
  }, [error, active, map]);

  // Device without an orientation sensor (typically desktop): hide the button.
  if (!isSupported) return null;

  const handleClick = async () => {
    if (active) {
      stop();
      setActive(false);
      map.setBearing(0);
      return;
    }
    const started = await start();
    if (started) setActive(true);
  };

  let tooltipId = 'Follow compass heading';
  if (error) {
    tooltipId = ERROR_MESSAGES[error];
  } else if (active) {
    tooltipId = 'Reset to north';
  }

  const isFollowing = active && !error && heading !== null;

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip
        title={formatMessage({ id: tooltipId })}
        open={error ? true : undefined}
        placement="left"
        arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            data-tour="map-compass"
            aria-label={formatMessage({ id: 'Follow compass heading' })}
            sx={{
              bgcolor: error ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              height: 44,
              width: 44,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' }
            }}>
            {isFollowing ? (
              <CompassNeedle bearing={headingToBearing(heading)} />
            ) : (
              <ExploreIcon
                sx={{ fontSize: 28, color: error ? 'white' : 'action.active' }}
              />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

export default CompassControl;
