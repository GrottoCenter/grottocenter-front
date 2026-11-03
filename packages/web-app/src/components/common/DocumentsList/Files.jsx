import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ListItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  getMediaThumbnailSources,
  isGalleryFile,
  isVideoFile
} from '@/utils/mediaUtils';
import MediaThumbnail, { ThumbnailsGrid } from './MediaThumbnail';
import MediaLightbox from './MediaLightbox';
import { isModelPreview, decodeFileName } from './utils/imageUtils';
import { getFileIcon } from './utils/fileIcons';
import { ThumbnailsPropTypes } from '../../../types/document.type';

const FileListItem = styled(ListItem)`
  margin: 0;
  & > * {
    margin: 0;
  }
  padding: 0;
`;

const Files = ({
  files = [],
  description,
  documentTitle,
  documentUrl,
  onMediaClick,
  mediaIndexOffset = 0
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (files.length === 0) return null;

  const mediaFiles = files.filter(file => isGalleryFile(file.fileName));
  const otherFiles = files.filter(file => !isGalleryFile(file.fileName));
  // A model is never an image fallback: only use API-generated thumbnails.
  const modelFiles = documentUrl ? otherFiles.filter(isModelPreview) : [];
  const previewFiles = [...mediaFiles, ...modelFiles];

  const handleThumbnailClick = index => {
    if (onMediaClick) {
      onMediaClick(mediaIndexOffset + index);
    } else {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      {previewFiles.length > 0 && (
        <ThumbnailsGrid $count={previewFiles.length} sx={{ mb: 1 }}>
          {previewFiles.map((file, index) => {
            const isVideo = isVideoFile(file.fileName);
            const { src, srcSet } = getMediaThumbnailSources(file);
            const isModel = isModelPreview(file);
            return (
              <MediaThumbnail
                key={`${file.fileName}:${src}`}
                src={src}
                srcSet={srcSet}
                alt={decodeFileName(file.fileName)}
                isVideo={isVideo}
                objectFit={isModel ? 'contain' : 'cover'}
                to={isModel ? documentUrl : undefined}
                onClick={
                  isModel ? undefined : () => handleThumbnailClick(index)
                }
              />
            );
          })}
        </ThumbnailsGrid>
      )}
      {/* Non-image files section (existing logic) */}
      {otherFiles.map(file => (
        <FileListItem key={`${file.fileName}`} dense component="div">
          <Button
            variant="text"
            size="small"
            target="_blank"
            startIcon={getFileIcon(file.fileName)}
            href={file.completePath}
            sx={{ textTransform: 'none' }}>
            {decodeFileName(file.fileName)}
          </Button>
        </FileListItem>
      ))}
      {/*
        Standalone callers keep a local gallery; DocumentsList supplies the
        shared cross-document gallery callback instead.
      */}
      {!onMediaClick && mediaFiles.length > 0 && (
        <MediaLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          media={mediaFiles}
          initialIndex={lightboxIndex}
          description={description}
          documentTitle={documentTitle}
        />
      )}
    </>
  );
};

Files.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string.isRequired,
      thumbnails: ThumbnailsPropTypes
    })
  ),
  description: PropTypes.string,
  documentTitle: PropTypes.string,
  documentUrl: PropTypes.string,
  onMediaClick: PropTypes.func,
  mediaIndexOffset: PropTypes.number
};

export default Files;
