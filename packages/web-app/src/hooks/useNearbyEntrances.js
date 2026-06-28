import { useState, useEffect, useRef } from 'react';
import { fetchNearbyEntrances } from '../actions/Geoloc';
import { computeBoundingBox } from '../helpers/boundingBox';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  DUPLICATE_DETECTION_RADIUS_KM
} from '../conf/config';
import { useDebounce } from './useDebounce';

const toFloat = value => {
  if (typeof value === 'number') return value;
  return parseFloat(String(value ?? '').replace(',', '.'));
};
const isValidLat = v => Number.isFinite(v) && v >= -90 && v <= 90;
const isValidLng = v => Number.isFinite(v) && v >= -180 && v <= 180;

/**
 * Fetches existing entrances near the entered coordinates so the user can see
 * whether a nearby entrance already matches the one they intend to create.
 *
 * - Debounces by 300 ms while the user adjusts coordinates.
 * - Returns [] (removing markers) when coordinates are empty or out of range.
 * - Swallows errors silently so the creation flow is never blocked.
 *
 * @param {string|number} latitude
 * @param {string|number} longitude
 * @param {boolean} [enabled=true] - Disable in edit mode.
 * @param {number} [radiusKm=1] - Search radius used to build the bounding box.
 * @returns {Array} Nearby entrances ({ id, name, latitude, longitude, ... }).
 */
export const useNearbyEntrances = (
  latitude,
  longitude,
  enabled = true,
  radiusKm = DUPLICATE_DETECTION_RADIUS_KM
) => {
  const lat = toFloat(latitude);
  const lng = toFloat(longitude);
  const hasValidCoords = enabled && isValidLat(lat) && isValidLng(lng);

  // Debounce a stable string key so equal coordinate values don't refire.
  const debouncedKey = useDebounce(
    hasValidCoords ? `${lat},${lng}` : '',
    AUTOCOMPLETE_DEBOUNCE_DELAY
  );

  const [entrances, setEntrances] = useState([]);
  // Incremented on every change; lets us drop stale/out-of-order responses.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!debouncedKey) {
      requestIdRef.current += 1;
      setEntrances([]);
      return;
    }

    const [keyLat, keyLng] = debouncedKey.split(',').map(Number);
    const bbox = computeBoundingBox(keyLat, keyLng, radiusKm);
    if (!bbox) {
      requestIdRef.current += 1;
      setEntrances([]);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    fetchNearbyEntrances(bbox)
      .then(data => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setEntrances(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return; // Stale.
        setEntrances([]);
      });
  }, [debouncedKey, radiusKm]);

  return entrances;
};

export default useNearbyEntrances;
