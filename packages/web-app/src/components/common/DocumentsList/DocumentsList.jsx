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

  const paginatedDocuments = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return documents.slice(startIndex, endIndex);
  }, [documents, page, itemsPerPage]);

  const totalPages = useMemo(
    () => Math.ceil((documents?.length || 0) / itemsPerPage),
    [documents, itemsPerPage]
  );

  // Collect all image files across paginated documents and compute per-document offsets
  const { allImages, imageOffsets } = useMemo(() => {
    const images = [];
    const offsets = [];
    paginatedDocuments.forEach(doc => {
      offsets.push(images.length);
      if (doc.files) {
        doc.files
          .filter(file => isImageFile(file.fileName))
          .forEach(file => {
            images.push({ ...file, description: doc.description });
          });
      }
    });
    return { allImages: images, imageOffsets: offsets };
  }, [paginatedDocuments]);

  const handleImageClick = useCallback(globalIndex => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  }, []);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <>
      {title && (
        <Typography variant="h3" gutterBottom>
          {title}
        </Typography>
      )}
      {documents && documents.length > 0 ? (
        <>
          <List dense disablePadding>
            {paginatedDocuments.map((document, i) => (
              <div key={document.id}>
                <DividerStyled />
                <Document
                  document={document}
                  hasSnapshotButton={hasSnapshotButton}
                  onUnlink={onUnlink}
                  onImageClick={handleImageClick}
                  imageIndexOffset={imageOffsets[i]}
                />
              </div>
            ))}
          </List>
          {totalPages > 1 && (
            <Box mt={2} display="flex" justifyContent="center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        emptyMessageComponent
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
