import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  List,
  Typography,
  Pagination,
  Box,
  ListItem,
  Paper,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DocumentSortSelect from '../DocumentSortSelect';
import {
  canSortDocuments,
  DOCUMENT_SORT_ORDERS,
  sortDocuments
} from '../../../utils/documentSort';
import { DocumentChildPropTypes } from '../../../types/document.type';
import Document from './Document';
import ImageLightbox from './ImageLightbox';
import { isImageFile } from './utils/imageUtils';
import { GALLERY_MIN_IMAGES } from './ImageThumbnail';

// Documents are wildly uneven: a bare article needn't eat a whole desktop row
// while a 15-photo gallery legitimately does. The 420px floor is wider than any
// phone viewport, so `auto-fill` collapses to one column on mobile with no
// breakpoint to maintain — and `min(100%, …)` stops that same floor overflowing
// a 390px container sideways.
const DocumentsGrid = styled(List)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
  // Lets a short card backfill the hole a full-width gallery leaves behind.
  gridAutoFlow: 'row dense',
  alignItems: 'start',
  gap: theme.spacing(1),
  // The grid owns its spacing: without this the rhythm would come from the
  // dense padding of a ListItem two components away, in another file.
  '& .MuiListItem-root': { paddingTop: 0, paddingBottom: 0 },
  // `gap` stops applying once the grid falls back to block flow.
  '@media print': {
    display: 'block',
    '& > *': { marginBottom: theme.spacing(1) }
  }
}));

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
  // Not `useSelector(state => state.intl)`: this component sits in `common/` and
  // has no Redux dependency, and the provider's locale is the same value.
  const { locale } = useIntl();
  const [page, setPage] = useState(1);
  // Not the publication order the collections default to: a document attached
  // to an entity is as often a survey or a photo as a publication, and those
  // carry no publication date at all — they would all pile up at the end. What
  // just arrived on the page is the useful answer here.
  const [sortOrder, setSortOrder] = useState(DOCUMENT_SORT_ORDERS.ADDED_DESC);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Everything below reads this array, never `documents`: the image offsets are
  // positional, so sorting anywhere downstream would make a thumbnail open its
  // neighbour's picture in the lightbox.
  const sortedDocuments = useMemo(
    () => sortDocuments(documents, sortOrder, locale),
    [documents, sortOrder, locale]
  );

  const totalPages = useMemo(
    () => Math.ceil((sortedDocuments.length || 0) / itemsPerPage),
    [sortedDocuments, itemsPerPage]
  );
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const { allImages, imageOffsets, isWide } = useMemo(() => {
    const images = [];
    const offsets = [];
    const wide = [];
    sortedDocuments.forEach(doc => {
      const start = images.length;
      offsets.push(start);
      if (doc.files) {
        doc.files
          .filter(file => isImageFile(file.fileName))
          .forEach(file =>
            images.push({
              ...file,
              description: doc.description,
              documentTitle: doc.title
            })
          );
      }
      // A gallery earns the full row: past the threshold its tiles no longer
      // fit one card. Derived here rather than recounted at render time.
      wide.push(images.length - start >= GALLERY_MIN_IMAGES);
    });
    return { allImages: images, imageOffsets: offsets, isWide: wide };
  }, [sortedDocuments]);

  const handleImageClick = useCallback(globalIndex => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  }, []);

  if (isLoading) {
    return (
      <DocumentsGrid dense disablePadding>
        {[0, 1, 2].map(i => (
          <DocumentSkeleton key={i} />
        ))}
      </DocumentsGrid>
    );
  }

  if (!sortedDocuments.length) return emptyMessageComponent ?? null;

  return (
    <>
      {/* One row for the title and the control, so the select costs no vertical
          space of its own on the lists that already have a heading. */}
      {(title || canSortDocuments(sortedDocuments)) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: title ? 'space-between' : 'flex-end',
            flexWrap: 'wrap',
            columnGap: 2,
            rowGap: 0.5,
            mb: 0.5
          }}>
          {title && <Typography variant="h3">{title}</Typography>}
          {canSortDocuments(sortedDocuments) && (
            // Print keeps the title but drops the control: on paper the order is
            // already fixed, and a dropdown is not something you can operate.
            <Box sx={{ '@media print': { display: 'none' } }}>
              <DocumentSortSelect
                value={sortOrder}
                onChange={order => {
                  setSortOrder(order);
                  // The document that was on screen is now somewhere else
                  // entirely; landing back on page 1 is the only honest answer.
                  setPage(1);
                }}
              />
            </Box>
          )}
        </Box>
      )}
      <DocumentsGrid dense disablePadding>
        {sortedDocuments.map((document, i) => {
          const isOnPage = i >= startIndex && i < endIndex;
          return (
            <Box
              key={document.id}
              sx={{
                display: isOnPage ? 'block' : 'none',
                // `1 / -1` rather than `span 2`: a no-op in a single column,
                // instead of forcing an implicit second one.
                gridColumn: isWide[i] ? '1 / -1' : 'auto',
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
      </DocumentsGrid>
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
  // Not `shape(Document.propTypes)`: that describes the component's prop table,
  // not a document, so it validated nothing.
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  isLoading: PropTypes.bool,
  title: PropTypes.node,
  emptyMessageComponent: PropTypes.node,
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func,
  itemsPerPage: PropTypes.number
};

export default DocumentsList;
