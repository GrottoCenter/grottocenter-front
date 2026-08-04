import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CircularProgress, IconButton, Tooltip, useTheme } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import { useMap } from 'react-leaflet';
import useDeviceOrientation from '../../../../hooks/useDeviceOrientation';
import {
  headingToBearing,
  shortestAngleDelta
} from '../../../../utils/compass';
import CustomControl from './CustomControl';

// Two-tone compass needle: the red tip points to true North. It is rotated by
// the current map bearing so it keeps indicating North on the rotated map.
const CompassNeedle = ({ bearing, northColor, southColor }) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{
      transform: `rotate(${bearing}deg)`,
      transition: 'transform 0.1s linear'
    }}>
    <polygon points="12,1 17,12 7,12" fill={northColor} />
    <polygon points="12,23 17,12 7,12" fill={southColor} />
  </svg>
);

CompassNeedle.propTypes = {
  bearing: PropTypes.number.isRequired,
  northColor: PropTypes.string.isRequired,
  southColor: PropTypes.string.isRequired
};

const ERROR_MESSAGES = {
  denied: 'Compass access denied. Enable it in your browser settings.',
  unavailable: 'No compass available on this device.'
};

const CompassControl = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const map = useMap();
  const { heading, isSupported, error, start, stop } = useDeviceOrientation();
  const [active, setActive] = useState(false);
  // Continuous (unwrapped) needle rotation for shortest-path animation.
  const [needleBearing, setNeedleBearing] = useState(0);
  const needleBearingRef = useRef(0);
  // Latest desired bearing, applied on zoomend if a zoom is in progress.
  const targetBearingRef = useRef(0);
  const zoomingRef = useRef(false);

  // Apply a bearing to the map and advance the needle by the shortest path.
  // The hook already rate-caps headings (~8Hz), so no extra frame coalescing.
  const applyBearing = useCallback(
    target => {
      map.setBearing(target);
      const next =
        needleBearingRef.current +
        shortestAngleDelta(needleBearingRef.current, target);
      needleBearingRef.current = next;
      setNeedleBearing(next);
    },
    [map]
  );

  const resetNorth = useCallback(() => {
    targetBearingRef.current = 0;
    needleBearingRef.current = 0;
    setNeedleBearing(0);
    map.setBearing(0);
  }, [map]);

  // Follow the heading; skip while a zoom animation runs (applied on zoomend).
  useEffect(() => {
    if (!active || heading === null) return;
    const target = headingToBearing(heading);
    targetBearingRef.current = target;
    if (!zoomingRef.current) applyBearing(target);
  }, [active, heading, applyBearing]);

  // Suspend bearing updates during zoom animations to avoid thrashing.
  useEffect(() => {
    const onZoomStart = () => {
      zoomingRef.current = true;
    };
    const onZoomEnd = () => {
      zoomingRef.current = false;
      if (active) applyBearing(targetBearingRef.current);
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [map, active, applyBearing]);

  // Let the rest of the map (e.g. heatmaps) react to the follow state so heavy
  // layers can be hidden while the map is continuously rotating.
  useEffect(() => {
    map.fire('compassfollowchange', { following: active && !error });
  }, [map, active, error]);

  // Any error (permission denied or no sensor) cancels the follow mode.
  useEffect(() => {
    if (error && active) {
      setActive(false);
      resetNorth();
    }
  }, [error, active, resetNorth]);

  // Device without an orientation sensor (typically desktop): hide the button.
  if (!isSupported) return null;

  const handleClick = async () => {
    if (active) {
      stop();
      setActive(false);
      resetNorth();
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
  const label = formatMessage({ id: tooltipId });

  const isFollowing = active && !error && heading !== null;
  const isActivating = active && !error && heading === null;

  let icon;
  if (isFollowing) {
    icon = (
      <CompassNeedle
        bearing={needleBearing}
        northColor={theme.palette.error.main}
        southColor={theme.palette.grey[500]}
      />
    );
  } else if (isActivating) {
    icon = (
      <CircularProgress
        size={20}
        sx={{ color: theme.palette.mapControlIcon }}
      />
    );
  } else {
    icon = (
      <ExploreIcon
        sx={{
          fontSize: 28,
          color: error ? 'white' : theme.palette.mapControlIcon
        }}
      />
    );
  }

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip
        title={label}
        open={error ? true : undefined}
        placement="left"
        arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            aria-label={label}
            sx={{
              bgcolor: error ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              height: 44,
              width: 44,
              '&:hover': { bgcolor: error ? 'error.dark' : '#f4f4f4' }
            }}>
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

export default CompassControl;
