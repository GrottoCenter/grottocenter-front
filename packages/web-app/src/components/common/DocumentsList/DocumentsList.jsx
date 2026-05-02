import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { List, Typography, Divider, Pagination, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Document from './Document';
import ImageLightbox from './ImageLightbox';
import { isImageFile } from './utils/imageUtils';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;

const DocumentsList = ({
  documents,
  title,
  emptyMessageComponent,
  hasSnapshotButton = false,
  onUnlink,
  itemsPerPage = 10
}) => {
  const [page, setPage] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const totalPages = useMemo(
    () => Math.ceil((documents?.length || 0) / itemsPerPage),
    [documents, itemsPerPage]
  );
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const { allImages, imageOffsets } = useMemo(() => {
    const images = [];
    const offsets = [];
    (documents ?? []).forEach(doc => {
      offsets.push(images.length);
      if (doc.files) {
        doc.files
          .filter(file => isImageFile(file.fileName))
          .forEach(file => images.push({ ...file, description: doc.description }));
      }
    });
    return { allImages: images, imageOffsets: offsets };
  }, [documents]);

  const handleImageClick = useCallback(globalIndex => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  }, []);

  if (!documents?.length) return emptyMessageComponent ?? null;

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      <List dense disablePadding>
        {documents.map((document, i) => {
          const isOnPage = i >= startIndex && i < endIndex;
          return (
            <Box
              key={document.id}
              sx={{ display: isOnPage ? 'block' : 'none', '@media print': { display: 'block' } }}>
              <DividerStyled />
              <Document
                document={document}
                hasSnapshotButton={hasSnapshotButton}
                onUnlink={onUnlink}
                onImageClick={isOnPage ? handleImageClick : undefined}
                imageIndexOffset={imageOffsets[i]}
              />
            </Box>
          );
        })}
      </List>
      {totalPages > 1 && (
        <Box
          mt={2}
          display="flex"
          justifyContent="center"
          sx={{ '@media print': { display: 'none' } }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
      {allImages.length > 0 && (
        <ImageLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={allImages}
          initialIndex={lightboxIndex}
        />
      )}
    </>
  );
};

DocumentsList.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.shape(Document.propTypes)),
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func,
  itemsPerPage: PropTypes.number
};

export default DocumentsList;
