import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';
import useGeolocation from '@/hooks/useGeolocation';
import useDeviceOrientation from '@/hooks/useDeviceOrientation';
import useWakeLock from '@/hooks/useWakeLock';

const UserLocationContext = createContext(null);
const DeviceHeadingContext = createContext(null);

// How long a working watch survives its last consumer (see below).
const KEEP_WARM_MS = 30000;

// Shared, map-scoped location + orientation. Mounted once inside the map so the
// unified location control, the user-location marker and the waypoint HUD all
// read a SINGLE geolocation watch and a SINGLE device-orientation subscription
// (battery + consistency), instead of each starting its own.
export const MapLocationProvider = ({ children }) => {
  // Ref-counted lazy activation: the watch (and its permission prompt) starts
  // only while at least one consumer requests it (see useRequestUserLocation),
  // so we never prompt for geolocation before the user asks for it.
  const [requestCount, setRequestCount] = useState(0);
  const enable = useCallback(() => setRequestCount(n => n + 1), []);
  const disable = useCallback(
    () => setRequestCount(n => Math.max(0, n - 1)),
    []
  );

  // Counted separately from the watch, because the two no longer coincide: the
  // location control starts tracking on its own when the permission is already
  // granted, and holding the screen awake off the back of a page load — rather
  // than of a deliberate tap — is not something to do to someone's battery.
  const [awakeCount, setAwakeCount] = useState(0);
  const requestAwake = useCallback(() => setAwakeCount(n => n + 1), []);
  const releaseAwake = useCallback(
    () => setAwakeCount(n => Math.max(0, n - 1)),
    []
  );

  // Field-navigation context: the primary use is guiding the user to a cave
  // entrance, so a coarse network fix isn't good enough — opt into GPS.
  const [isWatching, setIsWatching] = useState(false);
  const geo = useGeolocation({
    watch: true,
    enabled: isWatching,
    enableHighAccuracy: true
  });
  const orientation = useDeviceOrientation();

  // Losing the last consumer doesn't stop a *working* watch straight away:
  // re-acquiring a GPS fix from cold costs tens of seconds in the field, and
  // turning the location control off then on again is an ordinary gesture. A
  // grace period makes the position instant on the way back.
  //
  // A watch that never delivered has nothing to keep warm, and stopping it at
  // once is what makes the next activation a genuine retry — cleared error,
  // permission prompt re-issued.
  const hasFix = geo.hasLocation;
  useEffect(() => {
    if (requestCount > 0) {
      setIsWatching(true);
      return undefined;
    }
    if (!hasFix) {
      setIsWatching(false);
      return undefined;
    }
    const id = setTimeout(() => setIsWatching(false), KEEP_WARM_MS);
    return () => clearTimeout(id);
  }, [requestCount, hasFix]);

  // Field navigation is where the screen locking is both a usability problem and
  // the main reason the watch stops delivering. Tie the lock to its own count,
  // not to `isWatching`: neither the warm-up window above nor tracking the user
  // asked for merely by loading the page is a reason to keep the screen on.
  useWakeLock(awakeCount > 0);

  // Same ref-counted lazy activation for the orientation sensor, so whoever
  // needs a heading (the location dot's direction cone, the waypoint arrow) gets
  // one without having to own the sensor's lifecycle.
  const [headingCount, setHeadingCount] = useState(0);
  const requestHeading = useCallback(() => setHeadingCount(n => n + 1), []);
  const releaseHeading = useCallback(
    () => setHeadingCount(n => Math.max(0, n - 1)),
    []
  );

  const {
    start: startOrientation,
    stop: stopOrientation,
    needsPermission
  } = orientation;

  // Auto-start where no user gesture is required. On iOS the Device Orientation
  // API only grants permission from inside a gesture, so there we wait for the
  // location control's tap to call start() itself.
  useEffect(() => {
    if (headingCount === 0) {
      stopOrientation();
      return;
    }
    if (!needsPermission) startOrientation();
  }, [headingCount, needsPermission, startOrientation, stopOrientation]);

  // useGeolocation already memoises its result, so `geo` only changes identity
  // when something observable did. `active` is derived as a plain boolean —
  // NOT the raw requestCount — so bumping the count from 1 to 2 (another
  // consumer requests tracking) doesn't fan out a re-render to every subscriber.
  const active = requestCount > 0;
  const userLocation = useMemo(
    () => ({
      ...geo,
      active,
      enable,
      disable,
      requestAwake,
      releaseAwake
    }),
    [geo, active, enable, disable, requestAwake, releaseAwake]
  );

  const deviceHeading = useMemo(
    () => ({ ...orientation, requestHeading, releaseHeading }),
    [orientation, requestHeading, releaseHeading]
  );

  return (
    <DeviceHeadingContext.Provider value={deviceHeading}>
      <UserLocationContext.Provider value={userLocation}>
        {children}
      </UserLocationContext.Provider>
    </DeviceHeadingContext.Provider>
  );
};

MapLocationProvider.propTypes = { children: PropTypes.node };

export const useUserLocation = () => {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    throw new Error('useUserLocation must be used within a MapLocationProvider');
  }
  return ctx;
};

export const useDeviceHeading = () => {
  const ctx = useContext(DeviceHeadingContext);
  if (!ctx) {
    throw new Error(
      'useDeviceHeading must be used within a MapLocationProvider'
    );
  }
  return ctx;
};

// Declarative helper: keep the shared geolocation watch alive while `active` is
// true, releasing it on unmount or when `active` goes false. Ref-counted like
// its heading counterpart, but the location control is deliberately its only
// caller: it owns the watch, so `active` in the context and the control's own
// mode can never disagree. Features that merely *use* the position (the waypoint
// navigation) read it without requesting it, and degrade until tracking is on —
// that is what keeps the button honest.
//
// `keepScreenAwake` is the second, narrower request: tracking that the user
// asked for by tapping the control is field navigation and deserves the wake
// lock; tracking auto-started from an already-granted permission is not, and
// must leave the screen alone.
export const useRequestUserLocation = (active, keepScreenAwake = false) => {
  const { enable, disable, requestAwake, releaseAwake } = useUserLocation();
  useEffect(() => {
    if (!active) return undefined;
    enable();
    return disable;
  }, [active, enable, disable]);
  useEffect(() => {
    if (!active || !keepScreenAwake) return undefined;
    requestAwake();
    return releaseAwake;
  }, [active, keepScreenAwake, requestAwake, releaseAwake]);
};

// Same declarative contract for the compass heading: any consumer that draws a
// heading (the dot's cone, the waypoint arrow) requests one while it is mounted,
// instead of one component owning the sensor for everybody.
export const useRequestHeading = active => {
  const { requestHeading, releaseHeading } = useDeviceHeading();
  useEffect(() => {
    if (!active) return undefined;
    requestHeading();
    return releaseHeading;
  }, [active, requestHeading, releaseHeading]);
};
