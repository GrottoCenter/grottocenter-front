// Listens to organization mutation success actions and invalidates the
// corresponding tiles in the map cache so the visible map reflects the
// change within one refresh cycle.
//
// Entrance and Cave mutations have all migrated to useMutation hooks —
// they invalidate the tile cache directly in their own onSuccess, keeping
// the effect colocated with the mutation. Only Organization remains here
// until Phase B migrates it.
//
// Always invalidates (never injects the mutation payload) because /geoloc/*
// returns a map-optimized projection, not the full entity shape returned by
// POST/PUT. Refetching the affected tile is the only way to keep the cache
// a strict mirror of the server view.
import { invalidateAll } from '../utils/mapTileCache';
import { POST_ORGANIZATION_SUCCESS } from '../actions/Organization/CreateOrganization';
import { UPDATE_ORGANIZATION_SUCCESS } from '../actions/Organization/UpdateOrganization';
import {
  DELETE_ORGANIZATION_SUCCESS,
  DELETE_ORGANIZATION_PERMANENT_SUCCESS
} from '../actions/Organization/DeleteOrganization';

const mapCacheInvalidationMiddleware = () => next => action => {
  const result = next(action);
  switch (action?.type) {
    case POST_ORGANIZATION_SUCCESS:
    case UPDATE_ORGANIZATION_SUCCESS:
    case DELETE_ORGANIZATION_SUCCESS:
    case DELETE_ORGANIZATION_PERMANENT_SUCCESS:
      invalidateAll('organizations');
      break;
    default:
      break;
  }
  return result;
};

export default mapCacheInvalidationMiddleware;
