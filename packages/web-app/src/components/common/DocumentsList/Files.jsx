import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ListItem, ListItemText, Grid, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description, Download } from '@mui/icons-material';
import ImageThumbnail from './ImageThumbnail';
import ImageLightbox from './ImageLightbox';
import { isImageFile } from './utils/imageUtils';

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

const Files = ({ files = [], description }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (files.length === 0) return null;

  // Separate image files from other files
  const imageFiles = files.filter(file => isImageFile(file.fileName));
  const otherFiles = files.filter(file => !isImageFile(file.fileName));

  const handleThumbnailClick = index => {
    setLightboxIndex(index);
    setLightboxOpen(true);
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
                  alt={file.fileName}
                  onClick={() => handleThumbnailClick(index)}
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  href={file.completePath}
                  download
                  target="_blank"
                  sx={{ textTransform: 'none' }}
>
                  {file.fileName}
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
                href={file.completePath}
>
                {file.fileName}
              </Button>
            }
          />
        </FileListItem>
      ))}

      {/* Image lightbox modal */}
      {imageFiles.length > 0 && (
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
  description: PropTypes.string
};

export default Files;
