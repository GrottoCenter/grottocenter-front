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

const useWaypoint = () => useLocalStorage(WAYPOINT_STORAGE_KEY, null);

export default useWaypoint;
