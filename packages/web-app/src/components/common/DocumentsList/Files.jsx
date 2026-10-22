import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ListItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import ImageThumbnail, { ThumbnailsGrid } from './ImageThumbnail';
import ImageLightbox from './ImageLightbox';
import {
  isImageFile,
  getFileExtension,
  decodeFileName,
  getThumbnailSources
} from './utils/imageUtils';
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
  onImageClick,
  imageIndexOffset = 0
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (files.length === 0) return null;

  // Separate image files from other files
  const imageFiles = files.filter(file => isImageFile(file.fileName));
  const otherFiles = files.filter(file => !isImageFile(file.fileName));
  // A model is never an image fallback: only use API-generated thumbnails.
  const modelFiles = documentUrl
    ? otherFiles.filter(
        file =>
          ['.glb', '.gltf'].includes(getFileExtension(file.fileName)) &&
          (file.thumbnails?.small ||
            file.thumbnails?.medium ||
            file.thumbnails?.large)
      )
    : [];
  const previewFiles = [...imageFiles, ...modelFiles];

  const handleThumbnailClick = index => {
    if (onImageClick) {
      onImageClick(imageIndexOffset + index);
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
            const { src, srcSet } = getThumbnailSources(file);
            const isModel = !isImageFile(file.fileName);
            return (
              <ImageThumbnail
                key={`${file.fileName}:${src}`}
                src={src}
                srcSet={srcSet}
                alt={decodeFileName(file.fileName)}
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
        Fallback lightbox when not managed by a parent component.

        There are two lightbox management patterns in the app:
        1) Parent-managed (e.g. DocumentsList.jsx):
           - Uses `onImageClick` and `imageIndexOffset`
           - Enables cross-document navigation within a shared lightbox
        2) Self-managed (here in Files.jsx):
           - Used when `onImageClick` is not provided
           - Handles its own local lightbox state

        This fallback ensures Files.jsx remains usable in isolation.
        Note: in this mode, navigation is limited to images within this component only
        (no cross-document navigation).
      */}
      {!onImageClick && imageFiles.length > 0 && (
        <ImageLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={imageFiles}
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
  onImageClick: PropTypes.func,
  imageIndexOffset: PropTypes.number
};

export default Files;
