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
import CategoryIcon from '@mui/icons-material/Category';
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
  [DocumentTypes.PHYSICAL_OBJECT]: CategoryIcon,
  [DocumentTypes.SERVICE]: MiscellaneousServicesIcon,
  [DocumentTypes.REPORT]: SummarizeIcon,
  [DocumentTypes.SOFTWARE]: TerminalIcon
};

export const DOCUMENT_TYPE_FALLBACK_ICON = InsertDriveFileIcon;

export const getDocumentTypeIcon = type =>
  DOCUMENT_TYPE_ICONS[type] ?? DOCUMENT_TYPE_FALLBACK_ICON;

export const getParentDocumentType = type => {
  if (type === DocumentTypes.ARTICLE) return DocumentTypes.ISSUE;
  if (type === DocumentTypes.ISSUE) return DocumentTypes.COLLECTION;
  return undefined;
};

export const hasSameDocumentId = (firstId, secondId) =>
  firstId != null && secondId != null && String(firstId) === String(secondId);

export const isDocumentSelfParent = document =>
  hasSameDocumentId(document?.id, document?.parent?.id);

export const filterParentDocumentResults = (documents, currentDocumentId) =>
  documents.filter(
    document => !hasSameDocumentId(document.id, currentDocumentId)
  );

// Per-type file restrictions. null = unrestricted (backend-provided list applies).
const IMAGE_EXTENSIONS = [
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
];
const PUBLICATION_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  'doc',
  'docx',
  'epub',
  'odt',
  'pdf',
  'rtf',
  'txt'
];
const DATA_EXTENSIONS = [
  'csv',
  'gz',
  'json',
  'ods',
  'rdf',
  'txt',
  'xls',
  'xlsx',
  'xml',
  'zip'
];
const fileFormats = extensions => ({ mime: '', extensions });
const publicationFormats = fileFormats(PUBLICATION_EXTENSIONS);

export const DOCUMENT_TYPE_ACCEPT = {
  [DocumentTypes.IMAGE]: {
    mime: 'image/*',
    extensions: IMAGE_EXTENSIONS
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
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: publicationFormats,
  [DocumentTypes.ARTICLE]: publicationFormats,
  [DocumentTypes.BOOK]: publicationFormats,
  [DocumentTypes.ISSUE]: publicationFormats,
  [DocumentTypes.TEXT]: publicationFormats,
  [DocumentTypes.REPORT]: fileFormats([
    ...PUBLICATION_EXTENSIONS,
    'ppt',
    'pptx',
    'zip'
  ]),
  [DocumentTypes.STILL_IMAGE]: fileFormats(IMAGE_EXTENSIONS),
  [DocumentTypes.PHYSICAL_OBJECT]: fileFormats([
    ...IMAGE_EXTENSIONS,
    'glb',
    'gltf',
    'obj',
    'pdf'
  ]),
  [DocumentTypes.DATASET]: fileFormats(DATA_EXTENSIONS),
  [DocumentTypes.MAP]: fileFormats([
    ...IMAGE_EXTENSIONS,
    'dxf',
    'gpx',
    'kml',
    'kmz',
    'pdf',
    'shp',
    'zip'
  ]),
  [DocumentTypes.INTERACTIVE_RESOURCE]: fileFormats([
    ...IMAGE_EXTENSIONS,
    'avi',
    'glb',
    'gltf',
    'gz',
    'mp4',
    'obj',
    'pdf',
    'zip'
  ]),
  [DocumentTypes.SERVICE]: fileFormats([
    ...new Set([...PUBLICATION_EXTENSIONS, ...DATA_EXTENSIONS])
  ]),
  [DocumentTypes.SOFTWARE]: fileFormats([
    'gz',
    'h++',
    'json',
    'pdf',
    'pl',
    'txt',
    'xml',
    'zip'
  ]),
  // Only the formats actually present in the backend file-formats table are
  // advertised — a broad 'audio/*' / 'video/*' would let users pick formats the
  // server rejects on upload (aac, flac, wav, mkv, mov, webm, wmv…).
  [DocumentTypes.SOUND]: {
    mime: 'audio/mpeg,audio/basic,audio/x-gsm',
    extensions: ['au', 'gsm', 'mp3']
  },
  [DocumentTypes.MOVING_IMAGE]: {
    mime: 'video/mp4,video/x-msvideo,video/mpeg,image/gif',
    extensions: ['avi', 'gif', 'mp4', 'mpeg']
  },
  [DocumentTypes.TOPOGRAPHIC_DATA]: {
    mime: 'image/*,application/pdf,model/gltf-binary,model/gltf+json,.th,.th2,.thconfig,.lox,.dxf,.cxf,.dpt,.xyz,.xvi,.zip,.gz',
    extensions: [
      'bmp',
      'cxf',
      'dpt',
      'dxf',
      'eps',
      'gif',
      'glb',
      'gltf',
      'gpx',
      'gz',
      'jpeg',
      'jpg',
      'kml',
      'kmz',
      'lox',
      'obj',
      'pcx',
      'pdf',
      'png',
      'shp',
      'svg',
      'taz',
      'th',
      'th2',
      'thconfig',
      'tif',
      'tiff',
      'trk',
      'tro',
      'xcf',
      'xvi',
      'xyz',
      'zip'
    ]
  }
};

const isUnknown = docType => docType === DocumentTypes.UNKNOWN;
const isCollection = docType => docType === DocumentTypes.COLLECTION;
export const requiresDocumentAuthor = docType => !isCollection(docType);
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
// Types for which a file is expected (but no longer mandatory): warn the user
// when none is attached so they don't forget — they can't add one after the
// document is submitted and before it is validated by a moderator.
const FILE_EXPECTED_TYPES = new Set([
  DocumentTypes.IMAGE,
  DocumentTypes.TOPOGRAPHIC_DRAWING,
  DocumentTypes.MOVING_IMAGE,
  DocumentTypes.SOUND,
  DocumentTypes.PHYSICAL_OBJECT,
  DocumentTypes.MAP,
  DocumentTypes.DATASET,
  DocumentTypes.TOPOGRAPHIC_DATA,
  DocumentTypes.INTERACTIVE_RESOURCE,
  DocumentTypes.AUTHORIZATION_TO_PUBLISH
]);
const isFileExpected = docType => FILE_EXPECTED_TYPES.has(docType);
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
  isFileExpected,
  isIssue,
  isImage,
  isOther,
  isSimpleMedia,
  isTopographicDrawing,
  isUnknown
};

export const getDocumentTypeRules = type => {
  const hasType = !isUnknown(type) && !!type;
  const allowsFiles = hasType && !isEvent(type) && !isCollection(type);
  return {
    hasType,
    allowsFiles,
    expectFile: isFileExpected(type),
    accept: DOCUMENT_TYPE_ACCEPT[type] ?? null,
    requiresAuthor: requiresDocumentAuthor(type),
    parentType: getParentDocumentType(type),
    hasPages: isArticle(type),
    hasIssueNumber: isIssue(type),
    hasDate: hasType && !isCollection(type),
    requiresDate: isEvent(type),
    hasAdvancedMetadata:
      hasType && !isEvent(type) && !isAuthorizationToPublish(type),
    hasFileSharing: allowsFiles && !isAuthorizationToPublish(type),
    hasCollectionSharing: isCollection(type),
    hasGrantedLicense: isAuthorizationToPublish(type),
    allowAiAnalysis:
      allowsFiles && !isAuthorizationToPublish(type) && !isSimpleMedia(type)
  };
};

const PUBLICATION_PAYLOAD_FIELDS = [
  'license',
  'selectOptionAuthorizationDocument',
  'authorizationDocument'
];

const ADVANCED_PAYLOAD_FIELDS = [
  'identifier',
  'identifierType',
  'identifierPdfPageOffset',
  'editor',
  'iso3166',
  'subjects',
  'creatorComment'
];

export const filterDocumentPayload = docAttributes => {
  const rules = getDocumentTypeRules(
    docAttributes?.type ?? DocumentTypes.UNKNOWN
  );
  const allowedFields = new Set([
    'id',
    'type',
    'title',
    'description',
    'authors',
    'authorsOrganization',
    'mainLanguage',
    'mainLanguageName',
    ...(rules.hasDate ? ['datePublication'] : []),
    ...(rules.allowsFiles ? ['files'] : []),
    ...(rules.hasFileSharing || rules.hasCollectionSharing
      ? PUBLICATION_PAYLOAD_FIELDS
      : []),
    ...(rules.hasGrantedLicense ? ['license'] : []),
    ...(rules.hasAdvancedMetadata ? ADVANCED_PAYLOAD_FIELDS : []),
    ...(rules.requiresDate ? ['iso3166'] : []),
    ...(rules.parentType ? ['library', 'parent'] : []),
    ...(rules.hasPages ? ['pages'] : []),
    ...(rules.hasIssueNumber ? ['issue'] : [])
  ]);

  return Object.fromEntries(
    Object.entries(docAttributes ?? {}).filter(([key]) =>
      allowedFields.has(key)
    )
  );
};
