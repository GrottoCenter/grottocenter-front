import { getMapEntrancesUrl } from '../conf/apiRoutes';
import { checkAndGetStatus, makeUrl } from './utils';

/**
 * Fetch the existing entrances located within the given bounding box.
 *
 * Returns the raw entrances array. Intentionally does NOT dispatch to the
 * shared `state.map` Redux slice: this powers the informational
 * "nearby entrances" hint in the entrance creation form and must stay
 * isolated from the main map state.
 *
 * @param {{sw_lat:number, sw_lng:number, ne_lat:number, ne_lng:number}} bounds
 * @returns {Promise<Array>} Array of entrances ({ id, name, latitude, longitude, ... }).
 */
export const fetchNearbyEntrances = bounds =>
  fetch(makeUrl(getMapEntrancesUrl, bounds))
    .then(checkAndGetStatus)
    .then(response => response.json());
