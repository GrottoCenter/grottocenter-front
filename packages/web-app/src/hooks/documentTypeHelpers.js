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

// Per-type file restrictions. null = unrestricted (backend-provided list applies).
export const DOCUMENT_TYPE_ACCEPT = {
  [DocumentTypes.IMAGE]: {
    mime: 'image/*',
    extensions: [
      'bmp',
      'eps',
      'gif',
      'jpeg',
      'jpg',
      'pcx',
      'png',
      'svg',
      'tif',
      'tiff',
      'xcf'
    ]
  },
  [DocumentTypes.TOPOGRAPHIC_DRAWING]: {
    mime: 'image/*,application/pdf',
    extensions: [
      'bmp',
      'eps',
      'gif',
      'jpeg',
      'jpg',
      'pcx',
      'pdf',
      'png',
      'svg',
      'tif',
      'tiff',
      'xcf'
    ]
  },
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: {
    mime: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*',
    extensions: ['pdf', 'doc', 'docx', 'odt', 'txt', 'jpg', 'jpeg', 'png']
  },
  [DocumentTypes.SOUND]: {
    mime: 'audio/*',
    extensions: ['aac', 'aiff', 'flac', 'm4a', 'mp3', 'ogg', 'opus', 'wav', 'wma']
  },
  [DocumentTypes.MOVING_IMAGE]: {
    mime: 'video/*,image/gif',
    extensions: ['avi', 'gif', 'mkv', 'mov', 'mp4', 'ogv', 'webm', 'wmv']
  },
  [DocumentTypes.TOPOGRAPHIC_DATA]: {
    mime: 'image/*,application/pdf,.th,.th2,.thconfig,.lox,.dxf,.cxf,.dpt,.xyz,.xvi,.zip,.gz',
    extensions: [
      'bmp',
      'cxf',
      'dpt',
      'dxf',
      'eps',
      'gif',
      'gz',
      'jpeg',
      'jpg',
      'lox',
      'pcx',
      'pdf',
      'png',
      'svg',
      'th',
      'th2',
      'thconfig',
      'tif',
      'tiff',
      'xcf',
      'xvi',
      'xyz',
      'zip'
    ]
  }
};

const isUnknown = docType => docType === DocumentTypes.UNKNOWN;
const isCollection = docType => docType === DocumentTypes.COLLECTION;
const isIssue = docType => docType === DocumentTypes.ISSUE;
const isArticle = docType => docType === DocumentTypes.ARTICLE;
const isImage = docType => docType === DocumentTypes.IMAGE;
const isEvent = docType => docType === DocumentTypes.EVENT;
const isTopographicDrawing = docType =>
  docType === DocumentTypes.TOPOGRAPHIC_DRAWING;
const isAuthorizationToPublish = docType =>
  docType === DocumentTypes.AUTHORIZATION_TO_PUBLISH;
const SIMPLE_MEDIA_TYPES = new Set([
  DocumentTypes.IMAGE,
  DocumentTypes.TOPOGRAPHIC_DRAWING,
  DocumentTypes.MOVING_IMAGE,
  DocumentTypes.DATASET,
  DocumentTypes.INTERACTIVE_RESOURCE,
  DocumentTypes.MAP,
  DocumentTypes.PHYSICAL_OBJECT,
  DocumentTypes.SERVICE,
  DocumentTypes.SOFTWARE,
  DocumentTypes.SOUND,
  DocumentTypes.TOPOGRAPHIC_DATA
]);
const isSimpleMedia = docType => SIMPLE_MEDIA_TYPES.has(docType);
const isOther = docType =>
  !isArticle(docType) &&
  !isCollection(docType) &&
  !isIssue(docType) &&
  !isUnknown(docType);

export const documentTypeHelpers = {
  isArticle,
  isAuthorizationToPublish,
  isCollection,
  isEvent,
  isIssue,
  isImage,
  isOther,
  isSimpleMedia,
  isTopographicDrawing,
  isUnknown
};

