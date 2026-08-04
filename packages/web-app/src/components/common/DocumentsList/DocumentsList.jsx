import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  List,
  Typography,
  Pagination,
  Box,
  ListItem,
  Paper,
  Skeleton
} from '@mui/material';
import Document from './Document';
import ImageLightbox from './ImageLightbox';
import { isImageFile } from './utils/imageUtils';

const DocumentSkeleton = () => (
  <ListItem
    disableGutters
    sx={{
      display: 'block'
    }}>
    <Paper
      variant="outlined"
      sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Skeleton variant="text" width="55%" height={28} />
        <Skeleton variant="rounded" width={90} height={24} />
      </Box>
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </Paper>
  </ListItem>
);

const DocumentsList = ({
  documents,
  isLoading = false,
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
          .forEach(file =>
            images.push({ ...file, description: doc.description })
          );
      }
    });
    return { allImages: images, imageOffsets: offsets };
  }, [documents]);

  const handleImageClick = useCallback(globalIndex => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  }, []);

  if (isLoading) {
    return (
      <List dense disablePadding>
        {[0, 1, 2].map(i => (
          <DocumentSkeleton key={i} />
        ))}
      </List>
    );
  }

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
              sx={{
                display: isOnPage ? 'block' : 'none',
                '@media print': { display: 'block' }
              }}>
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
          mt={1}
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
  isLoading: PropTypes.bool,
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func,
  itemsPerPage: PropTypes.number
};

export default DocumentsList;
