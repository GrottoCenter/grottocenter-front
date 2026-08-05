import { useEffect, useState } from 'react';
import { defaultCoord } from '../conf/config';

const useGeolocation = () => {
  const [location, setLocation] = useState(defaultCoord);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setHasLocation(true);
      });
    }
  }, []);

  return { location, hasLocation };
};

export default useGeolocation;
