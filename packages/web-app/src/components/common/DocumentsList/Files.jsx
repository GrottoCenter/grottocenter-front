import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ListItem, ListItemText, Grid, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description, Download } from '@mui/icons-material';
import ImageThumbnail from './ImageThumbnail';
import ImageLightbox from './ImageLightbox';
import { isImageFile, decodeFileName } from './utils/imageUtils';

const FileListItem = styled(ListItem)`
  margin: 0;
  & > * {
    margin: 0;
  }
  padding: 0;
`;

const ThumbnailWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const EllipsisText = styled('span')`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

const Files = ({ files = [], description, onImageClick, imageIndexOffset = 0 }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (files.length === 0) return null;

  // Separate image files from other files
  const imageFiles = files.filter(file => isImageFile(file.fileName));
  const otherFiles = files.filter(file => !isImageFile(file.fileName));

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
      {/* Image thumbnails section */}
      {imageFiles.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {imageFiles.map((file, index) => (
            <Grid key={file.fileName}>
              <ThumbnailWrapper>
                <ImageThumbnail
                  src={file.completePath}
                  alt={decodeFileName(file.fileName)}
                  onClick={() => handleThumbnailClick(index)}
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  href={file.completePath}
                  download
                  target="_blank"
                  sx={{
                    textTransform: 'none',
                    maxWidth: 240, // Match thumbnail width
                    minWidth: 240 // for better rendering
                  }}
                  title={decodeFileName(file.fileName)}>
                  <EllipsisText>{decodeFileName(file.fileName)}</EllipsisText>
                </Button>
              </ThumbnailWrapper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Non-image files section (existing logic) */}
      {otherFiles.map(file => (
        <FileListItem key={`${file.fileName}`} dense component="div">
          <ListItemText
            primaryTypographyProps={{ display: 'inline' }}
            primary={
              <Button
                variant="text"
                size="small"
                target="_blank"
                startIcon={<Description />}
                href={file.completePath}>
                {decodeFileName(file.fileName)}
              </Button>
            }
          />
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
        />
      )}
    </>
  );
};

Files.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string.isRequired
    })
  ),
  description: PropTypes.string,
  onImageClick: PropTypes.func,
  imageIndexOffset: PropTypes.number
};

export default Files;
