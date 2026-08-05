import { useMemo } from 'react';
import useLocalStorage from './useLocalStorage';

// The temporary navigation waypoint, shared by every map that offers field
// navigation (the global map and the fullscreen entrance map). One storage key
// means one waypoint: placing it from an entrance page and finding it on the
// global map — or the reverse — is the same target, not two.
//
// Persisted so it survives a reload in the field. Note it does NOT start the
// geolocation watch: the location control owns that, so the waypoint can be
// restored without silently turning the GPS on (see MapLocationContext).
export const WAYPOINT_STORAGE_KEY = 'grottocenter_waypoint';

// A previous session may have written garbage (partial write, unrelated code
// clobbering the key, older schema) — pass anything but a finite lat/lng pair
// into Leaflet and it throws. Guard here so every consumer reads a known-good
// waypoint or null. Forward-compatible: an object with extra keys beyond
// lat/lng (a future schema addition) still passes through unchanged —
// downstream consumers only ever read lat/lng off it.
const isValidWaypoint = v =>
  v !== null &&
  typeof v === 'object' &&
  Number.isFinite(v.lat) &&
  Number.isFinite(v.lng);

const useWaypoint = () => {
  const [raw, setWaypoint] = useLocalStorage(WAYPOINT_STORAGE_KEY, null);
  const waypoint = useMemo(
    () => (isValidWaypoint(raw) ? raw : null),
    [raw]
  );
  return [waypoint, setWaypoint];
};

export default useWaypoint;
