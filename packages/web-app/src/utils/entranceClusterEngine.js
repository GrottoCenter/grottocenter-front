import Supercluster from 'supercluster';

import {
  hasEntranceCoordinateCriteria,
  matchesEntranceCoordinate
} from './entranceMapFilters';

// The general map switches to real markers at zoom 13. Its cluster index
// only needs levels 0-12; expansion zoom 13 still reaches those markers.
export const ENTRANCE_CLUSTER_MAX_ZOOM = 12;

export const createEntranceClusterEngine = () => {
  let coordinates = [];
  let index = null;
  let revision = 0;
  let hasCriteria = true;

  return message => {
    if (message.type === 'build') {
      if (message.data) {
        coordinates = message.data;
        // Legacy cache compatibility: check once per dataset. Old pairs (or a
        // mixed dataset) remain visible without filtering until refreshed.
        hasCriteria = coordinates.every(hasEntranceCoordinateCriteria);
      }
      const points = [];
      for (let i = 0; i < coordinates.length; i++) {
        const tuple = coordinates[i];
        if (!hasCriteria || matchesEntranceCoordinate(tuple, message.filters)) {
          points.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [tuple[0], tuple[1]] },
            properties: { pointId: i }
          });
        }
      }
      index = new Supercluster({
        radius: 100,
        maxZoom: ENTRANCE_CLUSTER_MAX_ZOOM
      }).load(points);
      revision = message.revision;
      return { type: 'ready', revision, hasCriteria };
    }

    let result = null;
    if (index && revision === message.revision) {
      if (message.type === 'clusters') {
        result = index.getClusters(message.bounds, message.zoom);
      } else if (message.type === 'expansion') {
        result = index.getClusterExpansionZoom(message.clusterId);
      }
    }
    return { type: 'result', requestId: message.requestId, revision, result };
  };
};
