import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Shortest signed angular difference (in ]-180, 180]) from `from` to `to`.
// Used to accumulate a continuous rotation so the needle never spins the long
// way around when the heading crosses the 0°/360° boundary.
const shortestAngleDelta = (from, to) =>
  ((((to - from) % 360) + 540) % 360) - 180;

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
  // Continuous (unwrapped) needle rotation for shortest-path animation.
  const [needleBearing, setNeedleBearing] = useState(0);
  const needleBearingRef = useRef(0);

  // Bearing application is coalesced to at most one map.setBearing per animation
  // frame and suspended during zoom animations, so following the compass never
  // floods the (CPU-bound) rotated redraws nor fights the zoom animation.
  const targetBearingRef = useRef(0);
  const rafRef = useRef(null);
  const zoomingRef = useRef(false);

  const applyBearing = useCallback(() => {
    rafRef.current = null;
    if (zoomingRef.current) return;
    const target = targetBearingRef.current;
    map.setBearing(target);
    const next =
      needleBearingRef.current +
      shortestAngleDelta(needleBearingRef.current, target);
    needleBearingRef.current = next;
    setNeedleBearing(next);
  }, [map]);

  const scheduleBearing = useCallback(() => {
    if (rafRef.current !== null || zoomingRef.current) return;
    rafRef.current = requestAnimationFrame(applyBearing);
  }, [applyBearing]);

  const resetNorth = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    targetBearingRef.current = 0;
    needleBearingRef.current = 0;
    setNeedleBearing(0);
    map.setBearing(0);
  }, [map]);

  // Queue the latest heading; the rAF loop applies it at most once per frame.
  useEffect(() => {
    if (!active || heading === null) return;
    targetBearingRef.current = headingToBearing(heading);
    scheduleBearing();
  }, [active, heading, scheduleBearing]);

  // Suspend bearing updates while a zoom animation runs; apply the latest on end.
  useEffect(() => {
    const onZoomStart = () => {
      zoomingRef.current = true;
    };
    const onZoomEnd = () => {
      zoomingRef.current = false;
      if (active) scheduleBearing();
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [map, active, scheduleBearing]);

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

  // Cancel any pending frame on unmount.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

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
              <CompassNeedle bearing={needleBearing} />
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
