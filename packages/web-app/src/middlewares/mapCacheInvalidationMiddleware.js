// Listens to entrance/cave/organization mutation success actions and
// invalidates the corresponding tiles in the map cache so the visible map
// reflects the change within one refresh cycle.
//
// Always invalidates (never injects the mutation payload) because /geoloc/*
// returns a map-optimized projection, not the full entity shape returned by
// POST/PUT. Refetching the affected tile is the only way to keep the cache
// a strict mirror of the server view.
import { invalidateAll, invalidateTileAt } from '../utils/mapTileCache';

const mapCacheInvalidationMiddleware = () => next => action => {
  const result = next(action);
  switch (action?.type) {
    case 'POST_ENTRANCE_SUCCESS':
      // action.data carries the new entrance with coordinates
      invalidateTileAt(
        'entrances',
        action.data?.latitude,
        action.data?.longitude
      );
      // A new entrance may also reshape its network's map projection.
      invalidateAll('networks');
      break;
    case 'POST_CAVE_SUCCESS':
      // Networks on the map are the projection of caves.
      invalidateAll('networks');
      break;
    case 'POST_ORGANIZATION_SUCCESS':
      invalidateTileAt(
        'organizations',
        action.organization?.latitude,
        action.organization?.longitude
      );
      break;
    case 'UPDATE_ENTRANCE_SUCCESS':
      // Payload is only httpCode today; fall back to nuclear invalidation.
      invalidateAll('entrances');
      invalidateAll('networks');
      break;
    case 'UPDATE_CAVE_SUCCESS':
      invalidateAll('networks');
      break;
    case 'UPDATE_ORGANIZATION_SUCCESS':
      invalidateAll('organizations');
      break;
    case 'DELETE_ENTRANCE_SUCCESS':
    case 'DELETE_ENTRANCE_PERMANENT_SUCCESS':
      invalidateAll('entrances');
      invalidateAll('networks');
      break;
    case 'DELETE_CAVE_SUCCESS':
    case 'DELETE_CAVE_PERMANENT_SUCCESS':
      invalidateAll('networks');
      break;
    case 'DELETE_ORGANIZATION_SUCCESS':
    case 'DELETE_ORGANIZATION_PERMANENT_SUCCESS':
      invalidateAll('organizations');
      break;
    default:
      break;
  }
  return result;
};

export default mapCacheInvalidationMiddleware;
