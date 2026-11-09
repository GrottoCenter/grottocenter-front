import {
  getFileExtension,
  getThumbnailSources,
  isImageFile
} from '@/components/common/DocumentsList/utils/imageUtils';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogv']);

export const isVideoFile = fileName =>
  VIDEO_EXTENSIONS.has(getFileExtension(fileName));

export const isGalleryFile = fileName =>
  isImageFile(fileName) || isVideoFile(fileName);

export const getDocumentMedia = documents =>
  (documents ?? []).flatMap(document =>
    (document.files ?? [])
      .filter(file => isGalleryFile(file.fileName))
      .map(file => ({
        ...file,
        documentTitle: document.title,
        description: document.description
      }))
  );

// Linked documents already contain validated files. This is a selection aid;
// the API remains responsible for format, document visibility and link checks.
export const getFeaturedImageCandidates = documents =>
  (documents ?? [])
    .filter(document => !document.isDeleted && !document.redirectTo)
    .flatMap(document =>
      (document.files ?? [])
        .filter(
          file => file.isValidated !== false && isImageFile(file.fileName)
        )
        .map(file => ({ ...file, documentTitle: document.title }))
    );

export const getVideoPoster = file =>
  file.thumbnails?.large ||
  file.thumbnails?.medium ||
  file.thumbnails?.small ||
  undefined;

export const getMediaThumbnailSources = file =>
  getThumbnailSources(
    isVideoFile(file.fileName) ? { ...file, completePath: undefined } : file
  );
