import ImageIcon from '@mui/icons-material/Image';
import DrawIcon from '@mui/icons-material/Draw';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import EventIcon from '@mui/icons-material/Event';
import MapIcon from '@mui/icons-material/Map';
import DatasetIcon from '@mui/icons-material/Dataset';
import LayersIcon from '@mui/icons-material/Layers';
import MovieIcon from '@mui/icons-material/Movie';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import TerminalIcon from '@mui/icons-material/Terminal';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SummarizeIcon from '@mui/icons-material/Summarize';

export const DocumentTypes = {
  UNKNOWN: -1,
  ARTICLE: 'Article',
  AUTHORIZATION_TO_PUBLISH: 'Authorization To Publish',
  BOOK: 'Book',
  COLLECTION: 'Collection',
  DATASET: 'Dataset',
  EVENT: 'Event',
  IMAGE: 'Image',
  INTERACTIVE_RESOURCE: 'Interactive Resource',
  ISSUE: 'Issue',
  MAP: 'Map',
  MOVING_IMAGE: 'Moving Image',
  PHYSICAL_OBJECT: 'Physical Object',
  REPORT: 'Report',
  SERVICE: 'Service',
  SOFTWARE: 'Software',
  SOUND: 'Sound',
  STILL_IMAGE: 'Still Image',
  TEXT: 'Text',
  TOPOGRAPHIC_DATA: 'Topographic Data',
  TOPOGRAPHIC_DRAWING: 'Topographic Drawing'
};

export const DOCUMENT_TYPE_ICONS = {
  [DocumentTypes.IMAGE]: ImageIcon,
  [DocumentTypes.TOPOGRAPHIC_DRAWING]: DrawIcon,
  [DocumentTypes.ARTICLE]: ArticleIcon,
  [DocumentTypes.BOOK]: MenuBookIcon,
  [DocumentTypes.ISSUE]: NewspaperIcon,
  [DocumentTypes.COLLECTION]: BookmarksIcon,
  [DocumentTypes.EVENT]: EventIcon,
  [DocumentTypes.MAP]: MapIcon,
  [DocumentTypes.DATASET]: DatasetIcon,
  [DocumentTypes.TOPOGRAPHIC_DATA]: LayersIcon,
  [DocumentTypes.MOVING_IMAGE]: MovieIcon,
  [DocumentTypes.SOUND]: HeadphonesIcon,
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: GavelIcon,
  [DocumentTypes.TEXT]: DescriptionIcon,
  [DocumentTypes.STILL_IMAGE]: PhotoLibraryIcon,
  [DocumentTypes.INTERACTIVE_RESOURCE]: TouchAppIcon,
  [DocumentTypes.PHYSICAL_OBJECT]: ViewInArIcon,
  [DocumentTypes.SERVICE]: MiscellaneousServicesIcon,
  [DocumentTypes.REPORT]: SummarizeIcon,
  [DocumentTypes.SOFTWARE]: TerminalIcon
};

export const DOCUMENT_TYPE_FALLBACK_ICON = InsertDriveFileIcon;

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

const BASE_PAYLOAD_FIELDS = ['id', 'type', 'title', 'authors'];
const LANGUAGE_PAYLOAD_FIELDS = ['mainLanguage', 'mainLanguageName'];
const FILE_PAYLOAD_FIELDS = [
  'files',
  'license',
  'selectOptionAuthorizationDocument',
  'authorizationDocument'
];
const ADVANCED_PAYLOAD_FIELDS = [
  'datePublication',
  'identifier',
  'identifierType',
  'editor',
  'iso3166',
  'subjects',
  'creatorComment'
];

/**
 * Strips docAttributes down to the fields relevant to the given document type.
 * Field groups mirror the conditional rendering in FormContent.jsx — keep in sync
 * when adding or removing form fields.
 * UNKNOWN (-1) falls through to the else branch (full set) intentionally: the form
 * is not submittable without a type so no filtering is needed.
 */
export const filterDocumentPayload = docAttributes => {
  const { type = DocumentTypes.UNKNOWN } = docAttributes ?? {};
  let allowedFields;

  if (isEvent(type)) {
    allowedFields = new Set([
      ...BASE_PAYLOAD_FIELDS,
      ...LANGUAGE_PAYLOAD_FIELDS,
      'description',
      'datePublication',
      'iso3166'
    ]);
  } else if (isCollection(type)) {
    allowedFields = new Set([
      ...BASE_PAYLOAD_FIELDS,
      ...LANGUAGE_PAYLOAD_FIELDS,
      ...ADVANCED_PAYLOAD_FIELDS,
      'description',
      'library'
    ]);
  } else if (isAuthorizationToPublish(type)) {
    // FILE_PAYLOAD_FIELDS is included for structural consistency, but FormContent.jsx
    // renders <AddFileForm showAuthorization={false} /> for this type, so
    // license and selectOptionAuthorizationDocument are never user-editable here —
    // they will be null and skipped by buildFormData.
    allowedFields = new Set([
      ...BASE_PAYLOAD_FIELDS,
      ...LANGUAGE_PAYLOAD_FIELDS,
      ...FILE_PAYLOAD_FIELDS,
      'description',
      'datePublication'
    ]);
  } else {
    allowedFields = new Set([
      ...BASE_PAYLOAD_FIELDS,
      ...LANGUAGE_PAYLOAD_FIELDS,
      ...FILE_PAYLOAD_FIELDS,
      ...ADVANCED_PAYLOAD_FIELDS,
      'description',
      'library',
      'pages',
      'parent',
      'issue'
    ]);
  }

  return Object.fromEntries(
    Object.entries(docAttributes).filter(([key]) => allowedFields.has(key))
  );
};
