import {
  caveKeys,
  documentKeys,
  entranceKeys,
  guidelineKeys,
  massifKeys,
  organizationKeys
} from '@/api/queryKeys';
import { deletedEntityCollectionUrls } from '@/conf/apiRoutes';
import { DELETED_ENTITIES } from './deletedEntityTypes';

const resources = [
  ['organizations', 'organization', 'Organizations', organizationKeys],
  ['entrances', 'entrance', 'Entrances', entranceKeys],
  ['massifs', 'massif', 'Massifs', massifKeys],
  ['caves', 'network', 'deletedEntities.caves', caveKeys],
  ['guidelines', 'guideline', 'Guidelines', guidelineKeys],
  ['documents', 'document', 'Documents', documentKeys]
];

export const DELETED_ENTITY_RESOURCES = Object.fromEntries(
  resources.map(([resource, kind, labelId, keys]) => [
    resource,
    {
      resource,
      kind,
      labelId,
      keys,
      entityType: DELETED_ENTITIES[kind],
      collectionUrl: deletedEntityCollectionUrls[resource]
    }
  ])
);

export const getDeletedEntityName = entity =>
  entity.title || entity.name || `#${entity.id}`;
