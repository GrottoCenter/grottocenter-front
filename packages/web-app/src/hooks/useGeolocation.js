import { useEffect, useState } from 'react';
import { defaultCoord } from '../conf/config';

const useGeolocation = () => {
  const [location, setLocation] = useState(defaultCoord);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsReady(true);
        },
        () => {
          setHasError(true);
          setIsReady(true);
        }
      );
    } else {
      setHasError(true);
      setIsReady(true);
    }
  }, []);

  return { location, isReady, hasError };
};

export default useGeolocation;
