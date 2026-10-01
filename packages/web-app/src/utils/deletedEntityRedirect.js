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
