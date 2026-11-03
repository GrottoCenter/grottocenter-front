import {
  getFileExtension,
  getThumbnailSources,
  isImageFile
} from '@/components/common/DocumentsList/utils/imageUtils';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mpeg', '.webm', '.ogv']);

export const isVideoFile = fileName =>
  VIDEO_EXTENSIONS.has(getFileExtension(fileName));

export const isGalleryFile = fileName =>
  isImageFile(fileName) || isVideoFile(fileName);

export const getVideoPoster = file =>
  file.thumbnails?.large ||
  file.thumbnails?.medium ||
  file.thumbnails?.small ||
  undefined;

export const getMediaThumbnailSources = file =>
  getThumbnailSources(
    isVideoFile(file.fileName) ? { ...file, completePath: undefined } : file
  );
