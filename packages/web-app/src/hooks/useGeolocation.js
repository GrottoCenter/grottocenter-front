import { useEffect, useState } from 'react';
import { defaultCoord, ipGeolocationUrl } from '../conf/config';

const useGeolocation = () => {
  const [location, setLocation] = useState(defaultCoord);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tryIpGeolocation = () => {
      fetch(ipGeolocationUrl)
        .then(res => res.json())
        .then(data => {
          if (data.latitude && data.longitude) {
            setLocation({ lat: data.latitude, lng: data.longitude });
          }
        })
        .catch(() => {})
        .finally(() => setIsReady(true));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          });
          setIsReady(true);
        },
        tryIpGeolocation
      );
    } else {
      tryIpGeolocation();
    }
  }, []);

  return { location, isReady };
};

export default useGeolocation;
