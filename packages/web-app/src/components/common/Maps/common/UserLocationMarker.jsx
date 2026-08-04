import { useEffect, useRef } from 'react';
import { Circle, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { useUserLocation, useDeviceHeading } from './MapLocationContext';
import {
  USER_LOCATION_COLOR,
  ACCURACY_CIRCLE_STYLE
} from './userLocationStyle';

// The blue location dot with a direction cone fanning out in the heading the
// device faces. The cone lives in a wrapper rotated by the raw heading; the
// marker itself is set rotateWithView, so leaflet-rotate spins the wrapper with
// the map bearing on top of that — net screen angle = bearing + heading, i.e. it
// points at the real-world heading whatever the map rotation.
const buildIcon = () => {
  const rgbaCone = 'rgba(25, 118, 210, 0.35)';
  const html = `
    <div style="width:48px;height:48px;position:relative;">
      <div class="user-location-cone"
           style="position:absolute;inset:0;transform-origin:50% 50%;transform:rotate(0deg);display:none;">
        <div style="position:absolute;left:50%;top:2px;transform:translateX(-50%);
                    width:0;height:0;border-left:14px solid transparent;
                    border-right:14px solid transparent;border-top:22px solid ${rgbaCone};"></div>
      </div>
      <div style="position:absolute;left:50%;top:50%;width:16px;height:16px;
                  margin:-8px 0 0 -8px;border-radius:50%;background:${USER_LOCATION_COLOR};
                  border:2.5px solid #fff;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>
    </div>`;
  return L.divIcon({
    className: '',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
};

const UserLocationMarker = () => {
  const map = useMap();
  const { location, accuracy, hasLocation, active, gpsHeading } =
    useUserLocation();
  const { heading } = useDeviceHeading();
  const markerRef = useRef(null);

  // Magnetometer heading when available, else the GPS course (only while moving).
  const facing = heading ?? gpsHeading;
  const shown = active && hasLocation;

  // Create the marker once (rotateWithView lets leaflet-rotate spin it with the
  // map bearing). interactive:false so it never swallows clicks meant for the map.
  useEffect(() => {
    const marker = L.marker([0, 0], {
      icon: buildIcon(),
      interactive: false,
      keyboard: false,
      rotateWithView: true,
      zIndexOffset: 800
    });
    markerRef.current = marker;
    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, []);

  // Add/remove and reposition the dot as tracking state / position change.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (shown) {
      marker.setLatLng([location.lat, location.lng]);
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else if (map.hasLayer(marker)) {
      marker.remove();
    }
  }, [map, shown, location]);

  // Rotate (or hide) the direction cone as the device heading changes.
  useEffect(() => {
    const marker = markerRef.current;
    const el = marker && marker.getElement();
    const cone = el && el.querySelector('.user-location-cone');
    if (!cone) return;
    if (facing == null) {
      cone.style.display = 'none';
      return;
    }
    cone.style.display = '';
    cone.style.transform = `rotate(${facing}deg)`;
  }, [facing, shown, location]);

  if (!shown || !accuracy) return null;
  return (
    <Circle
      center={[location.lat, location.lng]}
      radius={accuracy}
      pathOptions={ACCURACY_CIRCLE_STYLE}
    />
  );
};

export default UserLocationMarker;
