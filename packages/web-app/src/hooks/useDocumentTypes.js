export const DocumentTypes = {
  UNKNOWN: -1,
  COLLECTION: 'Collection',
  DATASET: 'Dataset',
  EVENT: 'Event',
  IMAGE: 'Image',
  INTERACTIVE_RESOURCE: 'Interactive Resource',
  MOVING_IMAGE: 'Moving Image',
  PHYSICAL_OBJECT: 'Physical Object',
  SERVICE: 'Service',
  SOFTWARE: 'Software',
  SOUND: 'Sound',
  STILL_IMAGE: 'Still Image',
  TEXT: 'Text',
  TOPOGRAPHIC_DRAWING: 'Topographic Drawing',
  TOPOGRAPHIC_DATA: 'Topographic Data',
  BOOK: 'Book',
  ISSUE: 'Issue',
  ARTICLE: 'Article',
  MAP: 'Map',
  AUTHORIZATION_TO_PUBLISH: 'Authorization To Publish'
};

export const useDocumentTypes = () => {
  const isUnknown = docType => docType === DocumentTypes.UNKNOWN;
  const isCollection = docType => docType === DocumentTypes.COLLECTION;
  const isIssue = docType => docType === DocumentTypes.ISSUE;
  const isArticle = docType => docType === DocumentTypes.ARTICLE;
  const isImage = docType => docType === DocumentTypes.IMAGE;

  // Image is also included in "Other" type.
  const isOther = docType =>
    !isArticle(docType) &&
    !isCollection(docType) &&
    !isIssue(docType) &&
    !isUnknown(docType);

  return {
    isArticle,
    isCollection,
    isIssue,
    isImage,
    isOther,
    isUnknown
  };
};
