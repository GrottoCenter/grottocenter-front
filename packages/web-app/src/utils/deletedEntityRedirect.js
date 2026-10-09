export const DELETED_ENTITY_REDIRECT_KINDS = {
  DOCUMENT: 'Document',
  ENTRANCE: 'Entrance',
  NETWORK: 'Network',
  MASSIF: 'Massif',
  ORGANIZATION: 'Organization'
};

export const getDeletedEntityRedirectUrl = (entityType, redirectId) => {
  if (redirectId == null || redirectId === '') return null;
  return `${entityType.url}${redirectId}`;
};

export const getPostDeletionUrl = (
  entityType,
  selectedId,
  existingRedirectId
) =>
  getDeletedEntityRedirectUrl(entityType, selectedId ?? existingRedirectId) ??
  '/';
