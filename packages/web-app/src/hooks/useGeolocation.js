import { useEffect, useState } from 'react';
import { defaultCoord } from '../conf/config';

// One-shot geolocation by default. Pass { watch: true } to keep tracking the
// position (watchPosition) — used by the waypoint navigation to update the live
// distance and the as-the-crow-flies line as the user moves.
const useGeolocation = ({ watch = false } = {}) => {
  const [location, setLocation] = useState(defaultCoord);
  const [hasLocation, setHasLocation] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const onPosition = position => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setAccuracy(position.coords.accuracy);
      setHasLocation(true);
    };

    if (!watch) {
      navigator.geolocation.getCurrentPosition(onPosition);
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(onPosition);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [watch]);

  return { location, hasLocation, accuracy };
};

export default useGeolocation;
