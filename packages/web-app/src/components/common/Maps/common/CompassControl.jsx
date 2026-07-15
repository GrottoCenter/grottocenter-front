import React, { useEffect, useState } from 'react';
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
              color: error ? 'white' : 'text.primary',
              height: 36,
              width: 36,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' }
            }}>
            <ExploreIcon
              sx={{
                fontSize: 24,
                color: active && !error ? 'primary.main' : 'inherit',
                transform:
                  active && heading !== null ? `rotate(${heading}deg)` : 'none',
                transition: 'transform 0.2s ease-out'
              }}
            />
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

export default CompassControl;
