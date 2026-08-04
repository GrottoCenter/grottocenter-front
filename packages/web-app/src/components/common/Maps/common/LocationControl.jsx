import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useMap, useMapEvent } from 'react-leaflet';
import { headingToBearing, shortestAngleDelta } from '@/utils/compass';
import { followCenterYOffset } from '@/utils/geo';
import { useNotification } from '@/hooks';
import { focusZoom } from '@/conf/config';
import CustomControl from './CustomControl';
import CompassNeedle from './CompassNeedle';
import {
  useUserLocation,
  useDeviceHeading,
  useRequestUserLocation
} from './MapLocationContext';
import {
  USER_LOCATION_COLOR,
  HEADING_UP_OFFSET_RATIO
} from './userLocationStyle';

// GeolocationPositionError code → i18n id (reuse existing keys).
// 1 denied · 2 unavailable · 3 timeout.
const GEO_ERROR_MESSAGES = {
  1: 'Location access denied. Enable it in your browser settings.',
  2: 'Your position could not be determined.',
  3: 'Location request timed out. Please try again.'
};

const COMPASS_ERROR_MESSAGES = {
  denied: 'Compass access denied. Enable it in your browser settings.',
  unavailable: 'No compass available on this device.'
};

// off      → not tracking (no dot)
// located  → tracking, dot shown, map not following (e.g. after a manual pan)
// follow   → recenters on the user, north-up
// compass  → heading-up: rotates the map to the heading and recenters (offset)
const MODE = {
  OFF: 'off',
  LOCATED: 'located',
  FOLLOW: 'follow',
  COMPASS: 'compass'
};

// Single "locate + compass" control replacing the old separate LocateControl
// (leaflet.locatecontrol) and CompassControl. One button cycles through the
// tracking modes, mirroring the location control of standard navigation apps.
const LocationControl = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const map = useMap();
  const { onError: notifyError } = useNotification();

  const {
    location,
    hasLocation,
    error: geoError,
    status: geoStatus
  } = useUserLocation();
  const {
    heading,
    isSupported: compassSupported,
    error: compassError,
    start: startCompass,
    stop: stopCompass
  } = useDeviceHeading();

  const [mode, setMode] = useState(MODE.OFF);

  // Keep the shared geolocation watch alive whenever we are tracking.
  useRequestUserLocation(mode !== MODE.OFF);

  // Refs read by stable callbacks / effects without widening their deps.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const locationRef = useRef(location);
  locationRef.current = location;
  const hasLocationRef = useRef(hasLocation);
  hasLocationRef.current = hasLocation;
  // Zoom to apply on the next recenter (focusZoom on first activation, else keep).
  const pendingZoomRef = useRef(null);

  // Continuous (unwrapped) needle rotation for shortest-path animation.
  const [needleBearing, setNeedleBearing] = useState(0);
  const needleBearingRef = useRef(0);
  const targetBearingRef = useRef(0);
  const zoomingRef = useRef(false);

  const canUseCompass =
    compassSupported &&
    compassError !== 'denied' &&
    compassError !== 'unavailable';

  // Recenter the map on the user, offset downwards in compass mode. Uses the
  // map's own rotation-aware container conversions, so the offset is correct
  // whatever the current bearing.
  const recenter = useCallback(
    (animate = true) => {
      const loc = locationRef.current;
      if (!loc || !hasLocationRef.current) return;
      const ratio =
        modeRef.current === MODE.COMPASS ? HEADING_UP_OFFSET_RATIO : 0.5;
      const userPoint = map.latLngToContainerPoint([loc.lat, loc.lng]);
      const yOff = followCenterYOffset(map.getSize().y, ratio);
      const center = map.containerPointToLatLng([
        userPoint.x,
        userPoint.y + yOff
      ]);
      const zoom = pendingZoomRef.current ?? map.getZoom();
      pendingZoomRef.current = null;
      map.setView(center, zoom, { animate });
    },
    [map]
  );

  // Apply a bearing to the map and advance the needle along the shortest path.
  const applyBearing = useCallback(
    target => {
      map.setBearing(target);
      const next =
        needleBearingRef.current +
        shortestAngleDelta(needleBearingRef.current, target);
      needleBearingRef.current = next;
      setNeedleBearing(next);
      // Rotation pivots around the container centre; recenter so the user stays
      // fixed at the offset point instead of swinging around it.
      recenter(false);
    },
    [map, recenter]
  );

  const resetNorth = useCallback(() => {
    targetBearingRef.current = 0;
    needleBearingRef.current = 0;
    setNeedleBearing(0);
    if (typeof map.setBearing === 'function') map.setBearing(0);
  }, [map]);

  // Follow the heading while in compass mode (skip during zoom animations).
  useEffect(() => {
    if (mode !== MODE.COMPASS || heading === null) return;
    const target = headingToBearing(heading);
    targetBearingRef.current = target;
    if (!zoomingRef.current) applyBearing(target);
  }, [mode, heading, applyBearing]);

  // Recenter on every position update while following.
  useEffect(() => {
    if (mode === MODE.FOLLOW || mode === MODE.COMPASS) recenter(true);
  }, [location, mode, recenter]);

  // Suspend bearing updates during zoom animations to avoid thrashing.
  useEffect(() => {
    const onZoomStart = () => {
      zoomingRef.current = true;
    };
    const onZoomEnd = () => {
      zoomingRef.current = false;
      if (modeRef.current === MODE.COMPASS) {
        applyBearing(targetBearingRef.current);
      }
    };
    map.on('zoomstart', onZoomStart);
    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomstart', onZoomStart);
      map.off('zoomend', onZoomEnd);
    };
  }, [map, applyBearing]);

  // A user drag detaches follow/compass (the dot stays, the button goes hollow).
  useMapEvent('dragstart', () => {
    setMode(m => (m === MODE.FOLLOW || m === MODE.COMPASS ? MODE.LOCATED : m));
  });

  // Follow (north-up) and off snap the map back to north. Detaching from compass
  // to 'located' keeps the current rotation frozen — the floating north-reset
  // control then offers to straighten it, like standard navigation apps.
  useEffect(() => {
    if (mode === MODE.FOLLOW || mode === MODE.OFF) resetNorth();
  }, [mode, resetNorth]);

  // Let heavy layers (heatmaps) hide while the map is continuously rotating.
  useEffect(() => {
    map.fire('compassfollowchange', { following: mode === MODE.COMPASS });
  }, [map, mode]);

  // Stop the orientation sensor when we stop tracking altogether.
  useEffect(() => {
    if (mode === MODE.OFF) stopCompass();
  }, [mode, stopCompass]);

  // Surface geolocation failures as a toast — never a silent no-op. A denied
  // permission ends tracking; a transient error keeps the current mode.
  const notifiedGeoErrorRef = useRef(null);
  useEffect(() => {
    if (!geoError) {
      notifiedGeoErrorRef.current = null;
      return;
    }
    if (mode !== MODE.OFF && geoError !== notifiedGeoErrorRef.current) {
      notifiedGeoErrorRef.current = geoError;
      notifyError(
        formatMessage({ id: GEO_ERROR_MESSAGES[geoError] || GEO_ERROR_MESSAGES[2] })
      );
      if (geoError === 1) setMode(MODE.OFF);
    }
  }, [geoError, mode, notifyError, formatMessage]);

  // A compass failure while heading-up drops back to north-up follow + a toast.
  useEffect(() => {
    if (mode === MODE.COMPASS && compassError) {
      notifyError(
        formatMessage({ id: COMPASS_ERROR_MESSAGES[compassError] })
      );
      setMode(MODE.FOLLOW);
    }
  }, [mode, compassError, notifyError, formatMessage]);

  const handleClick = () => {
    if (mode === MODE.OFF) {
      // Activate: request a high-accuracy fix (via useRequestUserLocation) and
      // start the compass sensor best-effort (it powers the dot's heading cone
      // even north-up). Calling start() directly keeps it in the user gesture,
      // required by the iOS permission prompt.
      if (map.getZoom() < focusZoom) pendingZoomRef.current = focusZoom;
      startCompass();
      setMode(MODE.FOLLOW);
      return;
    }
    if (mode === MODE.LOCATED) {
      setMode(MODE.FOLLOW);
      recenter(true);
      return;
    }
    if (mode === MODE.FOLLOW) {
      if (canUseCompass) setMode(MODE.COMPASS);
      else recenter(true);
      return;
    }
    // compass → back to north-up follow (the effect above resets the bearing).
    setMode(MODE.FOLLOW);
  };

  const isError = Boolean(geoError) && mode !== MODE.OFF;
  const isLocating = mode !== MODE.OFF && !hasLocation && geoStatus !== 'error';

  let icon;
  if (isError) {
    icon = <MyLocationIcon sx={{ fontSize: 26, color: 'white' }} />;
  } else if (isLocating) {
    icon = (
      <CircularProgress size={20} sx={{ color: theme.palette.mapControlIcon }} />
    );
  } else if (mode === MODE.COMPASS) {
    icon = (
      <CompassNeedle
        bearing={needleBearing}
        northColor={theme.palette.error.main}
        southColor={theme.palette.grey[500]}
      />
    );
  } else if (mode === MODE.FOLLOW) {
    icon = <MyLocationIcon sx={{ fontSize: 26, color: USER_LOCATION_COLOR }} />;
  } else if (mode === MODE.LOCATED) {
    icon = (
      <MyLocationIcon sx={{ fontSize: 26, color: theme.palette.mapControlIcon }} />
    );
  } else {
    icon = (
      <LocationSearchingIcon
        sx={{ fontSize: 26, color: theme.palette.mapControlIcon }}
      />
    );
  }

  let tooltipId = 'Use my location';
  if (isError) {
    tooltipId = GEO_ERROR_MESSAGES[geoError] || GEO_ERROR_MESSAGES[2];
  } else if (mode === MODE.COMPASS) {
    tooltipId = 'Reset to north';
  } else if (mode === MODE.FOLLOW) {
    tooltipId = canUseCompass ? 'Compass mode' : 'Recenter on your location';
  } else if (mode === MODE.LOCATED) {
    tooltipId = 'Recenter on your location';
  }
  const label = formatMessage({ id: tooltipId });

  return (
    <CustomControl position="bottomright" useLeafletControl>
      <Tooltip
        title={label}
        open={isError ? true : undefined}
        placement="left"
        arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleClick}
            aria-label={label}
            sx={{
              bgcolor: isError ? 'error.main' : 'background.paper',
              borderRadius: '4px',
              height: 44,
              width: 44,
              '&:hover': { bgcolor: isError ? 'error.dark' : '#f4f4f4' }
            }}>
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    </CustomControl>
  );
};

export default LocationControl;
