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

const UserLocationContext = createContext(null);
const DeviceHeadingContext = createContext(null);

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

  const geo = useGeolocation({ watch: true, enabled: requestCount > 0 });
  const orientation = useDeviceOrientation();

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

  const userLocation = useMemo(
    () => ({
      location: geo.location,
      accuracy: geo.accuracy,
      gpsHeading: geo.gpsHeading,
      speed: geo.speed,
      hasLocation: geo.hasLocation,
      error: geo.error,
      status: geo.status,
      active: requestCount > 0,
      enable,
      disable
    }),
    [
      geo.location,
      geo.accuracy,
      geo.gpsHeading,
      geo.speed,
      geo.hasLocation,
      geo.error,
      geo.status,
      requestCount,
      enable,
      disable
    ]
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
// true, releasing it on unmount or when `active` goes false. Ref-counted, so
// several consumers (location control, waypoint navigation) can request it
// independently without stepping on each other.
export const useRequestUserLocation = active => {
  const { enable, disable } = useUserLocation();
  useEffect(() => {
    if (!active) return undefined;
    enable();
    return disable;
  }, [active, enable, disable]);
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
