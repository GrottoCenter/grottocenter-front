export const DocumentTypes = {
  UNKNOWN: 0,
  COLLECTION: 1,
  DATASET: 2,
  EVENT: 3,
  IMAGE: 4,
  INTERACTIVE_RESOURCE: 5,
  MOVING_IMAGE: 6,
  PHYSICAL_OBJECT: 7,
  SERVICE: 8,
  SOFTWARE: 9,
  SOUND: 10,
  STILL_IMAGE: 11,
  TEXT: 12,
  TOPOGRAPHIC_DRAWING: 13,
  TOPOGRAPHIC_DATA: 14,
  BOOK: 16,
  ISSUE: 17,
  ARTICLE: 18,
  MAP: 19,
  AUTHORIZATION_TO_PUBLISH: 20
};

export const isUnknown = documentType => {
  return documentType.id === DocumentTypes.UNKNOWN;
};
export const isCollection = documentType => {
  return documentType.id === DocumentTypes.COLLECTION;
};
export const isIssue = documentType => {
  return documentType.id === DocumentTypes.ISSUE;
};
export const isArticle = documentType => {
  return documentType.id === DocumentTypes.ARTICLE;
};
// Image is also included in "Other" type.
export const isImage = documentType => {
  return documentType.id === DocumentTypes.IMAGE;
};
export const isOther = documentType => {
  return (
    !isUnknown(documentType) &&
    !isCollection(documentType) &&
    !isIssue(documentType) &&
    !isArticle(documentType)
  );
};
