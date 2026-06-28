import { useState, useEffect, useRef } from 'react';
import { fetchNearbyEntrances } from '../actions/Geoloc';
import { computeBoundingBox } from '../utils/boundingBox';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  DUPLICATE_DETECTION_RADIUS_KM,
  DUPLICATE_DETECTION_MIN_ZOOM
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
 * The search follows the map: the coordinates track the map centre (the central
 * pin), so it works the same whether the user types coordinates or pans/zooms
 * the map. To avoid flooding the API while navigating it both debounces and
 * rounds the centre to ~100 m, and it stays idle below `minZoom` (where showing
 * markers on a world/continent view would be meaningless).
 *
 * - Debounces by 300 ms and ignores sub-~100 m movements.
 * - Returns [] (removing markers) when coordinates are empty/out of range or the
 *   map is zoomed out past `minZoom`.
 * - Swallows errors silently so the creation flow is never blocked.
 *
 * @param {string|number} latitude
 * @param {string|number} longitude
 * @param {boolean} [enabled=true] - Disable in edit mode.
 * @param {number} [zoom] - Current map zoom; markers are hidden below `minZoom`.
 * @param {number} [radiusKm=1] - Search radius used to build the bounding box.
 * @param {number} [minZoom=11] - Lowest zoom at which markers are shown.
 * @returns {Array} Nearby entrances ({ id, name, latitude, longitude, ... }).
 */
export const useNearbyEntrances = (
  latitude,
  longitude,
  enabled = true,
  zoom = null,
  radiusKm = DUPLICATE_DETECTION_RADIUS_KM,
  minZoom = DUPLICATE_DETECTION_MIN_ZOOM
) => {
  const lat = toFloat(latitude);
  const lng = toFloat(longitude);
  const zoomedInEnough = Number.isFinite(zoom) && zoom >= minZoom;
  const hasValidCoords =
    enabled && zoomedInEnough && isValidLat(lat) && isValidLng(lng);

  const [entrances, setEntrances] = useState([]);
  // Incremented on every change; lets us drop stale/out-of-order responses.
  const requestIdRef = useRef(0);

  // Bumped each time the search becomes invalid (blanked coordinates, or the map
  // zoomed out past the threshold). Folding it into the debounced key guarantees
  // that returning to the *same* coordinates afterwards yields a distinct key,
  // so the fetch effect re-runs instead of being skipped because the string
  // matches the previous value.
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!hasValidCoords) {
      setGeneration(g => g + 1);
      requestIdRef.current += 1; // Cancel any in-flight response.
      setEntrances([]); // Drop stale markers now, not after the debounce window.
    }
  }, [hasValidCoords]);

  // Debounce a stable string key so equal coordinate values don't refire. The
  // centre is rounded to ~100 m so that small pans within the search area don't
  // each trigger a new request.
  const debouncedKey = useDebounce(
    hasValidCoords ? `${generation}:${lat.toFixed(3)},${lng.toFixed(3)}` : '',
    AUTOCOMPLETE_DEBOUNCE_DELAY
  );

  useEffect(() => {
    if (!debouncedKey) {
      requestIdRef.current += 1;
      setEntrances([]);
      return;
    }

    // Key is `${generation}:${lat},${lng}` — strip the generation prefix.
    const coords = debouncedKey.slice(debouncedKey.indexOf(':') + 1);
    const [keyLat, keyLng] = coords.split(',').map(Number);
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
