import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { CircularProgress, IconButton, Tooltip, useTheme } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ExploreIcon from '@mui/icons-material/Explore';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useMap, useMapEvent } from 'react-leaflet';
import { headingToBearing } from '@/utils/compass';
import { followCenterYOffset } from '@/utils/geo';
import { useNotification } from '@/hooks';
import useContinuousAngle from '@/hooks/useContinuousAngle';
import useGeolocationPermission from '@/hooks/useGeolocationPermission';
import { focusZoom } from '@/conf/config';
import CustomControl from './CustomControl';
import NorthResetControl from './NorthResetControl';
import useMapOverlayContainer from './useMapOverlayContainer';
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

// GeolocationPositionError code → semantic i18n key.
// 1 denied · 2 unavailable · 3 timeout.
const GEO_ERROR_MESSAGES = {
  1: 'location.error.denied',
  2: 'location.error.unavailable',
  3: 'location.error.timeout'
};

const COMPASS_ERROR_MESSAGES = {
  denied: 'compass.error.denied',
  unavailable: 'compass.error.unavailable'
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
// follow; a separate round north button (rendered here, top-right) appears
// whenever the map ends up rotated and offers to straighten it back out —
// mirroring the location + compass controls of standard navigation apps.
const LocationControl = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const map = useMap();
  const { onError: notifyError } = useNotification();
  const overlayContainer = useMapOverlayContainer();

  const { location, hasLocation, error: geoError } = useUserLocation();
  const {
    heading,
    isSupported: compassSupported,
    error: compassError,
    start: startCompass
  } = useDeviceHeading();

  const [mode, setMode] = useState(MODE.OFF);
  const permission = useGeolocationPermission();

  // Whether tracking was turned on by a tap rather than by the auto-start below.
  // Only a tap is a statement of intent to navigate, and only that earns the
  // wake lock.
  const [userActivated, setUserActivated] = useState(false);

  // Keep the shared geolocation watch and orientation sensor alive whenever we
  // are tracking. The provider owns their lifecycle (ref-counted), so the sensor
  // stays on for other consumers — e.g. the waypoint arrow — independently.
  useRequestUserLocation(mode !== MODE.OFF, userActivated);
  useRequestHeading(mode !== MODE.OFF);

  // Already-granted permission: show the user where they are without making them
  // ask for something they have already agreed to. Reading the permission never
  // raises a dialog (see useGeolocationPermission), so this can never prompt.
  //
  // LOCATED, never FOLLOW: the dot and its accuracy circle appear, the map does
  // not move. Recentring and zooming a map the user may have opened on a
  // specific target — a URL, a saved position — is something only a tap gets to
  // do. The tap cycle is simply shifted by one: tap 1 → FOLLOW, tap 2 → COMPASS.
  const autoStartDoneRef = useRef(false);
  useEffect(() => {
    if (autoStartDoneRef.current || permission !== 'granted') return;
    autoStartDoneRef.current = true;
    setMode(MODE.LOCATED);
  }, [permission]);

  // Refs read by stable callbacks / effects without widening their deps.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const locationRef = useRef(location);
  locationRef.current = location;
  const hasLocationRef = useRef(hasLocation);
  hasLocationRef.current = hasLocation;
  // Zoom to apply on the next recenter (focusZoom on first activation, else keep).
  const pendingZoomRef = useRef(null);

  // Last bearing actually applied to the map, and its unwrapped counterpart for
  // the needle: CompassNeedle animates its transform, so it must be fed a
  // continuous angle or it spins the long way round whenever the bearing crosses
  // the 0/360 boundary. Going through the accumulator on EVERY path — including
  // resetNorth — is what keeps straightening the map from whipping the needle
  // back through a full turn.
  const [appliedBearing, setAppliedBearing] = useState(0);
  const needleBearing = useContinuousAngle(appliedBearing);
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
      setAppliedBearing(target);
      // Rotation pivots around the container centre; recenter so the user stays
      // fixed at the offset point instead of swinging around it.
      recenter(false);
    },
    [map, recenter]
  );

  const resetNorth = useCallback(() => {
    targetBearingRef.current = 0;
    // Through the accumulator, not a hard 0: after the user has turned around,
    // needleBearing sits at -350 (or -710) and assigning 0 outright made the
    // needle animate the whole way back. The accumulator lands on the nearest
    // equivalent of north instead, so it just settles.
    setAppliedBearing(0);
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
      // PERMISSION_DENIED is only terminal when the permission really is gone.
      // Chrome reports code 1 for a dialog the user merely dismissed, and again
      // — without any dialog — once an origin is under its auto-embargo, so
      // treating every code 1 as final is what silently killed tracking and
      // made the dot vanish mid-session. Under a live grant it is a platform
      // hiccup: report it, keep tracking.
      if (geoError === 1 && permission !== 'granted') setMode(MODE.OFF);
    }
  }, [geoError, mode, permission, notifyError, formatMessage]);

  // A compass failure while heading-up drops back to north-up follow + a toast.
  useEffect(() => {
    if (mode === MODE.COMPASS && compassError) {
      notifyError(formatMessage({ id: COMPASS_ERROR_MESSAGES[compassError] }));
      setMode(MODE.FOLLOW);
    }
  }, [mode, compassError, notifyError, formatMessage]);

  const handleClick = () => {
    // A tap is the statement of intent the auto-start above deliberately isn't:
    // it earns the wake lock, and it closes the auto-start for good. Without the
    // latter, a user tapping while the permission is still 'prompt' and then
    // granting would see the arriving 'granted' fire the auto-start effect and
    // demote their FOLLOW back to LOCATED.
    autoStartDoneRef.current = true;
    setUserActivated(true);

    if (permission === 'denied') {
      // No dialog will ever come back from here, so starting a watch would only
      // buy a doomed acquisition and a delayed toast. Say so straight away.
      notifyError(formatMessage({ id: GEO_ERROR_MESSAGES[1] }));
      return;
    }

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
      // First tap after an auto-start: LOCATED was reached without a gesture, so
      // this tap is the real activation and gets what OFF → FOLLOW gets — the
      // zoom-in from a far-out view, and startCompass() from inside the gesture,
      // the only place iOS grants the orientation permission. Tapping back after
      // a drag is a different thing and must not re-zoom.
      if (!userActivated) {
        if (map.getZoom() < focusZoom) pendingZoomRef.current = focusZoom;
        startCompass();
      }
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
    //
    // Deliberately no path back to OFF from a tap: turning tracking off is
    // handled implicitly (permission revoked, error) or by leaving the map.
    // Two-tap cycles (follow ↔ compass) are the field-navigation gesture; an
    // extra "off" state would demote it to a three-tap ring where the last
    // step is a hazard — one accidental tap and the dot vanishes mid-walk.
    setMode(MODE.FOLLOW);
  };

  // Rotated, either because compass follow is actively rotating the map, or
  // because the bearing was left frozen by a mode where nothing resets it —
  // LOCATED after a drag out of compass, or FOLLOW re-entered from LOCATED
  // (follow→located preserves the bearing, and located→follow doesn't reset).
  // Either way the floating north badge (top-right) offers to straighten it.
  //
  // OFF is absent from the list because it cannot be rotated: like FOLLOW it
  // goes through resetNorth() in the mode effect above, so by the time it is
  // the current mode the bearing is already 0 and the badge would have nothing
  // to offer. LOCATED is the only mode that leaves one standing.
  const normalizedBearing = ((needleBearing % 360) + 360) % 360;
  const showNorthButton =
    mode === MODE.COMPASS ||
    ((mode === MODE.LOCATED || mode === MODE.FOLLOW) &&
      normalizedBearing !== 0);

  const handleNorthClick = () => {
    if (mode === MODE.COMPASS) {
      setMode(MODE.FOLLOW);
    } else {
      resetNorth();
    }
  };

  const isError = Boolean(geoError) && mode !== MODE.OFF;
  const isLocating = mode !== MODE.OFF && !hasLocation && !geoError;

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
  // 'Use my location' predates the semantic-key convention used below
  // ('location.error.denied', 'Compass mode', ...) — kept as-is to avoid an
  // unrelated i18n key churn; it already exists in every lang file.
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
          arrow
          slotProps={{ popper: { container: overlayContainer } }}>
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
