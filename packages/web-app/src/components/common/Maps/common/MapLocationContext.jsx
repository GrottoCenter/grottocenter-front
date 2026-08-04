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
  // Orientation lifecycle is owned by the location control (start() must run in
  // a user gesture for the iOS permission prompt); everyone else just reads it.
  const orientation = useDeviceOrientation();

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

  return (
    <DeviceHeadingContext.Provider value={orientation}>
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
