import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { CircularProgress, IconButton, Tooltip, useTheme } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ExploreIcon from '@mui/icons-material/Explore';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useMap, useMapEvent } from 'react-leaflet';
import { headingToBearing, shortestAngleDelta } from '@/utils/compass';
import { followCenterYOffset } from '@/utils/geo';
import { useNotification } from '@/hooks';
import { focusZoom } from '@/conf/config';
import CustomControl from './CustomControl';
import NorthResetControl from './NorthResetControl';
import {
  useUserLocation,
  useDeviceHeading,
  useRequestUserLocation,
  useRequestHeading
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

// "Locate + compass" control replacing the old separate LocateControl
// (leaflet.locatecontrol) and CompassControl. This button tracks the user
// (off → follow, drag detaches to located) and enters compass mode from
// follow; a separate north button (rendered here, stacked above) appears
// whenever the map ends up rotated and offers to straighten it back out —
// mirroring the location + compass controls of standard navigation apps.
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
    start: startCompass
  } = useDeviceHeading();

  const [mode, setMode] = useState(MODE.OFF);

  // Keep the shared geolocation watch and orientation sensor alive whenever we
  // are tracking. The provider owns their lifecycle (ref-counted), so the sensor
  // stays on for other consumers — e.g. the waypoint arrow — independently.
  useRequestUserLocation(mode !== MODE.OFF);
  useRequestHeading(mode !== MODE.OFF);

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

  // Follow (north-up) and off snap the map back to north. Detaching from compass
  // to 'located' keeps the current rotation frozen — the floating north-reset
  // control then offers to straighten it, like standard navigation apps.
  //
  // Declared BEFORE the recenter effect on purpose: setBearing pivots around the
  // container centre, and in compass mode the user sits well below it, so
  // straightening swings them away. Recentering afterwards computes the target
  // under the final bearing and puts them back; the reverse order recentered
  // towards a target computed for the old bearing, then rotated around a pivot
  // caught mid-animation — the map landed off and only the next fix fixed it.
  useEffect(() => {
    if (mode === MODE.FOLLOW || mode === MODE.OFF) resetNorth();
  }, [mode, resetNorth]);

  // Recenter on every position update while following.
  const recenteredModeRef = useRef(mode);
  useEffect(() => {
    const previous = recenteredModeRef.current;
    recenteredModeRef.current = mode;
    if (mode !== MODE.FOLLOW && mode !== MODE.COMPASS) return;
    // Entering or leaving compass mode changes the bearing and the offset ratio
    // in this very commit, and the rotation above is instantaneous. Recenter
    // unanimated so both land in the same frame and read as one motion, instead
    // of an instant straighten followed by a glide. Every other recenter — a new
    // fix, re-attaching after a pan — keeps its animation.
    const rotated =
      previous !== mode && (previous === MODE.COMPASS || mode === MODE.COMPASS);
    recenter(!rotated);
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

  // Acting on the map content detaches follow/compass back to 'located' (the dot
  // stays, rotation stops, the bearing freezes). While following, every fix
  // recenters the map, so any view change the user asks for would otherwise be
  // undone within a second — detaching is what makes those interactions work.
  const detach = useCallback(
    () =>
      setMode(m =>
        m === MODE.FOLLOW || m === MODE.COMPASS ? MODE.LOCATED : m
      ),
    []
  );

  // dragstart: a manual pan. popupopen: every entity tap (entrance, network,
  // organization, massif, search result) goes through a popup. 'followdetach':
  // the explicit signal for affordances that move the map without a popup —
  // the off-screen waypoint badge, cluster dives, geocoding jumps.
  useMapEvent('dragstart', detach);
  useMapEvent('popupopen', detach);
  useMapEvent('followdetach', detach);

  // Let heavy layers (heatmaps) hide while the map is continuously rotating.
  useEffect(() => {
    map.fire('compassfollowchange', { following: mode === MODE.COMPASS });
  }, [map, mode]);

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
        formatMessage({
          id: GEO_ERROR_MESSAGES[geoError] || GEO_ERROR_MESSAGES[2]
        })
      );
      if (geoError === 1) setMode(MODE.OFF);
    }
  }, [geoError, mode, notifyError, formatMessage]);

  // A compass failure while heading-up drops back to north-up follow + a toast.
  useEffect(() => {
    if (mode === MODE.COMPASS && compassError) {
      notifyError(formatMessage({ id: COMPASS_ERROR_MESSAGES[compassError] }));
      setMode(MODE.FOLLOW);
    }
  }, [mode, compassError, notifyError, formatMessage]);

  const handleClick = () => {
    if (mode === MODE.OFF) {
      // Activate: request a high-accuracy fix and a heading (both declared
      // above). Also call start() here so iOS gets its permission prompt from
      // inside the user gesture — the only place it is allowed.
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
    // compass: the map already recenters on every fix, so a recenter here would
    // be a no-op tap. Close the cycle instead — back to north-up follow, exactly
    // like the north button, which then disappears.
    setMode(MODE.FOLLOW);
  };

  // Rotated, either because compass follow is actively rotating the map, or
  // because a drag detached tracking and left the bearing frozen. Either way
  // the floating north button (below) offers a way to straighten it out.
  const normalizedBearing = ((needleBearing % 360) + 360) % 360;
  const showNorthButton =
    mode === MODE.COMPASS || (mode === MODE.LOCATED && normalizedBearing !== 0);

  const handleNorthClick = () => {
    if (mode === MODE.COMPASS) {
      setMode(MODE.FOLLOW);
    } else {
      resetNorth();
    }
  };

  const isError = Boolean(geoError) && mode !== MODE.OFF;
  const isLocating = mode !== MODE.OFF && !hasLocation && geoStatus !== 'error';

  let icon;
  if (isError) {
    icon = <MyLocationIcon sx={{ fontSize: 26, color: 'white' }} />;
  } else if (isLocating) {
    icon = (
      <CircularProgress
        size={20}
        sx={{ color: theme.palette.mapControlIcon }}
      />
    );
  } else if (mode === MODE.COMPASS) {
    // The four modes must each be recognisable: the button's next action differs
    // in every one of them. Shape tells how far up the cycle we are (no fix →
    // fix → locked on the user), colour is reserved for the heading-up map.
    icon = <ExploreIcon sx={{ fontSize: 26, color: USER_LOCATION_COLOR }} />;
  } else if (mode === MODE.FOLLOW) {
    // Following north-up: the compass rose previews the step a tap gives, still
    // grey since the map is not rotated yet. Without a usable compass the cycle
    // ends here, so keep the tracking icon rather than advertise a dead end.
    icon = canUseCompass ? (
      <ExploreIcon sx={{ fontSize: 26, color: theme.palette.mapControlIcon }} />
    ) : (
      <MyLocationIcon sx={{ fontSize: 26, color: USER_LOCATION_COLOR }} />
    );
  } else if (mode === MODE.LOCATED) {
    icon = (
      <MyLocationIcon
        sx={{ fontSize: 26, color: theme.palette.mapControlIcon }}
      />
    );
  } else {
    icon = (
      <LocationSearchingIcon
        sx={{ fontSize: 26, color: theme.palette.mapControlIcon }}
      />
    );
  }

  // Each label announces what the *next* tap does, so it doubles as the
  // non-visual reading of the current mode.
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
    <>
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
      {showNorthButton && (
        <NorthResetControl bearing={needleBearing} onClick={handleNorthClick} />
      )}
    </>
  );
};

export default LocationControl;
