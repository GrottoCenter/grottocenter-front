import { useState, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
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
import { styled, useTheme } from '@mui/material/styles';
import DocumentSortSelect from '../DocumentSortSelect';
import {
  canSortDocuments,
  DOCUMENT_SORT_ORDERS,
  sortDocuments
} from '../../../utils/documentSort';
import { DocumentChildPropTypes } from '../../../types/document.type';
import Document from './Document';
import DocumentReferences from './DocumentReferences';
import ImageLightbox from './ImageLightbox';
import { isImageFile } from './utils/imageUtils';
import {
  calculateMasonryRowSpan,
  MASONRY_ROW_HEIGHT
} from './utils/masonryUtils';
import { GALLERY_MIN_IMAGES } from './ImageThumbnail';

// Documents are wildly uneven: a bare article needn't eat a whole desktop row
// while a 15-photo gallery legitimately does. The 420px floor is wider than any
// phone viewport, so `auto-fill` collapses to one column on mobile with no
// breakpoint to maintain — and `min(100%, …)` stops that same floor overflowing
// a 390px container sideways.
const DocumentsGrid = styled(List)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
  // One-pixel implicit rows let each card span its measured height instead of
  // inheriting the height of the tallest card beside it. The vertical spacing
  // is included in that span; the negative margin removes it after the final
  // card, where a regular grid gap would not render either.
  gridAutoRows: `${MASONRY_ROW_HEIGHT}px`,
  gridAutoFlow: 'row dense',
  alignItems: 'start',
  columnGap: theme.spacing(1),
  rowGap: 0,
  marginBottom: theme.spacing(-1),
  // The grid owns its spacing: without this the rhythm would come from the
  // dense padding of a ListItem two components away, in another file.
  '& .MuiListItem-root': { paddingTop: 0, paddingBottom: 0 },
  // Grid placement stops applying once the grid falls back to block flow.
  '@media print': {
    display: 'block',
    marginBottom: 0,
    '& > *': { marginBottom: theme.spacing(1) }
  }
}));

const DocumentsGridItem = ({ children, isVisible = true, isWide = false }) => {
  const theme = useTheme();
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const verticalGap = Number.parseFloat(theme.spacing(1)) || 0;

  // Measure before paint so cards never flash in one-pixel rows. Observing the
  // content wrapper also catches lazy images, wrapping titles, locale changes
  // and container resizes without coupling the card to the grid.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !isVisible) return undefined;

    const updateHeight = height => {
      const nextHeight = Math.ceil(height);
      setContentHeight(currentHeight =>
        currentHeight === nextHeight ? currentHeight : nextHeight
      );
    };

    updateHeight(content.getBoundingClientRect().height);

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(([entry]) => {
      updateHeight(entry.contentRect.height);
    });
    observer.observe(content);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <Box
      sx={{
        display: isVisible ? 'block' : 'none',
        // `1 / -1` rather than `span 2`: a no-op in a single column, instead
        // of forcing an implicit second one.
        gridColumn: isWide ? '1 / -1' : 'auto',
        gridRowEnd: `span ${calculateMasonryRowSpan(
          contentHeight,
          verticalGap
        )}`,
        '@media print': { display: 'block' }
      }}>
      <Box ref={contentRef}>{children}</Box>
    </Box>
  );
};

DocumentsGridItem.propTypes = {
  children: PropTypes.node.isRequired,
  isVisible: PropTypes.bool,
  isWide: PropTypes.bool
};

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
  const { formatMessage, locale } = useIntl();
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
  // `page` is state but the list under it is a prop: navigating to another
  // entity, or unlinking the last document of the last page, can drop the count
  // below it and leave the user on a blank page. Clamping rather than resetting
  // to 1 moves them only when the page they were on stopped existing.
  // State is left intentionally unclamped: the next Pagination click or entity
  // load resets it naturally, so writing `setPage(currentPage)` here would only
  // add a render.
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const startIndex = (currentPage - 1) * itemsPerPage;
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
          <DocumentsGridItem key={i}>
            <DocumentSkeleton />
          </DocumentsGridItem>
        ))}
      </DocumentsGrid>
    );
  }

  if (!sortedDocuments.length) return emptyMessageComponent ?? null;

  return (
    <>
      {title && <Typography variant="h3">{title}</Typography>}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          columnGap: 2,
          rowGap: 1,
          mb: 0.5
        }}>
        <Typography variant="h5" component="h3">
          {formatMessage({ id: 'Document list' })}
        </Typography>
        {canSortDocuments(sortedDocuments) && (
          // On paper the order is already fixed, and a dropdown is not
          // operable.
          <Box
            sx={{
              flexShrink: 0,
              ml: 'auto',
              '@media print': { display: 'none' }
            }}>
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
      <DocumentsGrid dense disablePadding>
        {sortedDocuments.map((document, i) => {
          const isOnPage = i >= startIndex && i < endIndex;
          return (
            <DocumentsGridItem
              key={document.id}
              isVisible={isOnPage}
              isWide={isWide[i]}>
              <Document
                document={document}
                hasSnapshotButton={hasSnapshotButton}
                onUnlink={onUnlink}
                onImageClick={isOnPage ? handleImageClick : undefined}
                imageIndexOffset={imageOffsets[i]}
              />
            </DocumentsGridItem>
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
            page={currentPage}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
      {/* Keep references aligned with the full sorted list: they have their own
          preview/expansion and must not be limited to the visible card page. */}
      <DocumentReferences documents={sortedDocuments} />
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
