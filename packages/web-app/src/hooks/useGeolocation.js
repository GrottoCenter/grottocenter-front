import { useEffect, useState } from 'react';
import { defaultCoord } from '../conf/config';

// One-shot geolocation by default. Pass { watch: true } to keep tracking the
// position (watchPosition) — used by the location marker and the waypoint
// navigation to update the live distance and the as-the-crow-flies line as the
// user moves.
//
// - enabled=false keeps the hook dormant (no permission prompt, no tracking)
//   until the consumer flips it on — used by the location control's lazy
//   activation, so we never prompt for geolocation before the user asks for it.
// - High accuracy is off by default: coarse network-based fixes are fine for
//   "center the map on where I am" style consumers, and much faster/cheaper on
//   battery. Field-navigation consumers (LocationControl, WaypointNavigation)
//   opt in explicitly via the shared MapLocationProvider.
// - A finite timeout means a denied/unreachable sensor surfaces an error instead
//   of hanging forever, so consumers can give feedback.
const useGeolocation = ({
  watch = false,
  enabled = true,
  enableHighAccuracy = false,
  timeout = 10000,
  maximumAge = 10000
} = {}) => {
  const [location, setLocation] = useState(defaultCoord);
  const [hasLocation, setHasLocation] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  // GPS-derived course (deg) and speed (m/s). Only defined while moving, so they
  // are a fallback heading source when the device has no magnetometer.
  const [gpsHeading, setGpsHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  // GeolocationPositionError code: 1 denied, 2 unavailable, 3 timeout — or null.
  const [error, setError] = useState(null);
  // 'idle' | 'locating' | 'active' | 'error'
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return undefined;

    // Fresh session: clear a stale error from the previous run so the consumer's
    // "notify once per error code" logic re-arms and the button doesn't flash
    // red before the first fix (or first fresh error) comes in. Also drop the
    // previous fix so a follow consumer doesn't briefly recentre on the old
    // position (and its spinner shows) until the first fresh fix arrives.
    setError(null);
    setStatus('locating');
    setHasLocation(false);

    const onPosition = position => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setAccuracy(position.coords.accuracy);
      // coords.heading / coords.speed are null (or NaN) while the device is
      // stationary — normalise both to a finite number or null.
      setGpsHeading(
        Number.isFinite(position.coords.heading)
          ? position.coords.heading
          : null
      );
      setSpeed(
        Number.isFinite(position.coords.speed) ? position.coords.speed : null
      );
      setHasLocation(true);
      setError(null);
      setStatus('active');
    };

    const onError = err => {
      setError(err.code);
      setStatus('error');
    };

    const options = { enableHighAccuracy, timeout, maximumAge };

    if (!watch) {
      navigator.geolocation.getCurrentPosition(onPosition, onError, options);
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      options
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [watch, enabled, enableHighAccuracy, timeout, maximumAge]);

  return { location, hasLocation, accuracy, gpsHeading, speed, error, status };
};

export default useGeolocation;
