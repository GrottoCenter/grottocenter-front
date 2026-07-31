import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Chip,
  List,
  ListItem,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Linkify from 'linkify-react';

import AppLink from '@/components/common/AppLink';
import { getFileIcon } from '@/components/common/DocumentsList/utils/fileIcons';
import linkifyOptions from '@/helpers/linkifyOptions';
import {
  canReorderDocumentChildren,
  CHILDREN_SORT_ORDERS
} from '@/utils/documentChildrenSort';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON
} from '@/utils/documentTypeHelpers';
import {
  getChildDisplay,
  hasOwnDescription
} from '@/utils/documentChildrenLabel';
import { DocumentChildPropTypes } from '@/types/document.type';

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

// An attached file is the only availability signal that is actual data.
//
// Detecting a URL inside the free-text description was tried and dropped: it
// meant pattern-matching prose, and since `.la`, `.at`, `.be`, `.it` and `.co`
// are real TLDs, French text with a missing space after a full stop ("l'aval.On")
// was flagged as often as a genuine link. A badge that is wrong part of the time
// is worse than no badge.
const getAttachedFileName = doc => {
  const file = doc.files?.[0];
  // Fall back to completePath: some payloads carry the path without a separate
  // fileName, and keying only on fileName silently disabled the indicator.
  return file?.fileName ?? file?.completePath ?? null;
};

// A chip rather than a bare icon: on its own, an icon dropped next to a title
// reads as a button. Enclosed and outlined it reads as a badge — a statement
// about the item, not something to click. The legend uses the same chip so the
// two are visibly the same vocabulary.
const MarkerChip = styled(Chip)(({ theme }) => ({
  height: 'auto',
  cursor: 'inherit',
  '& .MuiChip-label': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.25, 0.75),
    fontSize: theme.typography.body2.fontSize,
    lineHeight: 1.3
  }
}));

// Only presence is marked: badging "nothing attached" would put an identical
// icon on the great majority of entries, which is the noise this indicator
// exists to replace. The legend is what makes the absence readable.
//
// Deliberately no tooltip: a badge that reacts to the pointer reads as a button.
// The legend in the section header names the marker once for the whole list, and
// the aria-label carries the same text for screen readers.
const AvailabilityMarker = ({ fileName, sx }) => {
  const { formatMessage } = useIntl();
  if (!fileName) return null;
  return (
    <MarkerChip
      size="small"
      variant="outlined"
      aria-label={formatMessage({ id: 'File available' })}
      sx={sx}
      label={getFileIcon(fileName)}
    />
  );
};

AvailabilityMarker.propTypes = {
  fileName: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  sx: PropTypes.object
};

/* -------------------------------------------------------------------------- */
/* Sort control                                                               */
/* -------------------------------------------------------------------------- */

const ChildrenSortSelect = ({ value, onChange }) => {
  const { formatMessage } = useIntl();
  const labels = {
    [CHILDREN_SORT_ORDERS.DATE_DESC]: formatMessage({ id: 'Newest first' }),
    [CHILDREN_SORT_ORDERS.DATE_ASC]: formatMessage({ id: 'Oldest first' }),
    [CHILDREN_SORT_ORDERS.TITLE]: formatMessage({ id: 'Title' })
  };
  return (
    <Select
      variant="standard"
      disableUnderline
      value={value}
      onChange={event => onChange(event.target.value)}
      inputProps={{ 'aria-label': formatMessage({ id: 'Sort by' }) }}
      renderValue={selected => (
        <>
          <SwapVertIcon fontSize="small" />
          {labels[selected]}
        </>
      )}
      // A control, not content: it stays muted and a notch below the body size
      // so it reads without competing with the list it acts on.
      sx={theme => ({
        flexShrink: 0,
        color: 'text.secondary',
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: theme.typography.body2.fontSize,
          paddingTop: 0,
          paddingBottom: 0
        }
      })}
    >
      {Object.entries(labels).map(([order, label]) => (
        <MenuItem key={order} value={order}>
          {label}
        </MenuItem>
      ))}
    </Select>
  );
};

ChildrenSortSelect.propTypes = {
  value: PropTypes.oneOf(Object.values(CHILDREN_SORT_ORDERS)).isRequired,
  onChange: PropTypes.func.isRequired
};

/* -------------------------------------------------------------------------- */
/* Header controls                                                            */
/* -------------------------------------------------------------------------- */

const ControlsRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  columnGap: theme.spacing(1.5),
  rowGap: theme.spacing(0.5)
}));

/**
 * Legend and sort control as one group, so it can be dropped either into a plain
 * section heading or straight into a card's own header row — where, unlike a row
 * added inside the card body, it costs no vertical space at all.
 *
 * The sort control only appears when a handler is passed AND reordering could
 * actually change the list — offering three orders that all produce the same
 * result, as happens when every document carries the same date, is noise. The
 * legend likewise only lists the states actually present.
 *
 * With neither, the component returns null rather than an empty row: an element
 * that always renders still counts as a flex child and leaves a gap behind.
 */
export const ChildrenControls = ({
  documents,
  sortOrder,
  onSortOrderChange
}) => {
  const { formatMessage } = useIntl();
  // Up to four of these are instantiated per page render, and the parent
  // re-renders on every dialog / sort / license state change — so the array scan
  // and the Set built by canReorderDocumentChildren are kept off that path.
  const hasFiles = useMemo(
    () => (documents ?? []).some(doc => getAttachedFileName(doc)),
    [documents]
  );
  const showSort = useMemo(
    () => Boolean(onSortOrderChange) && canReorderDocumentChildren(documents),
    [documents, onSortOrderChange]
  );
  if (!hasFiles && !showSort) return null;

  return (
    <ControlsRow>
      {hasFiles && (
        <MarkerChip
          size="small"
          variant="outlined"
          label={
            <>
              <InsertDriveFileIcon fontSize="small" color="action" />
              {formatMessage({ id: 'File available' })}
            </>
          }
        />
      )}
      {showSort && (
        <ChildrenSortSelect value={sortOrder} onChange={onSortOrderChange} />
      )}
    </ControlsRow>
  );
};

ChildrenControls.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  sortOrder: PropTypes.oneOf(Object.values(CHILDREN_SORT_ORDERS)),
  onSortOrderChange: PropTypes.func
};

// Wraps on narrow screens instead of squeezing the title against the controls.
export const ChildrenSectionHeader = ({ title, controls }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      columnGap: 2,
      rowGap: 0.5,
      mb: 1
    }}
  >
    {title}
    {controls}
  </Box>
);

ChildrenSectionHeader.propTypes = {
  title: PropTypes.node,
  controls: PropTypes.node
};

/* -------------------------------------------------------------------------- */
/* Tiles — a collection's issues                                              */
/* -------------------------------------------------------------------------- */

// A shelf of volumes. The issue designation leads — it is what identifies the
// item — with the date underneath as the chronological anchor. Both are derived
// by getChildDisplay, which also decides when the date would merely repeat the
// designation. Tiles reflow from 2 columns on a phone to 5 on a wide screen
// without any breakpoint.
const TilesGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
  gap: theme.spacing(1)
}));

const Tile = styled(AppLink)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.25),
  padding: theme.spacing(2, 1.5, 1.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  textAlign: 'center',
  textDecoration: 'none',
  color: 'inherit',
  transition: theme.transitions.create(['border-color', 'background-color']),
  '&:hover, &:focus-visible': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
    textDecoration: 'none'
  }
}));

// An issue designation is short ("No 47", "n°6") and has to read at a glance
// from across the grid, so it gets a display size. Collections whose titles do
// not reduce to a short designation step down instead of forcing every tile to
// be sized for the worst case.
//
// The tier is chosen ONCE per grid, from the longest label in it — never per
// tile. Sizing each tile on its own label put "N° 9, Mars" at display size right
// next to "N° 17, Février" at two thirds of it: the same kind of item rendered
// two different ways inside one row.
//
// Sizes are in rem and the theme sets htmlFontSize to 10, so 1rem is 10px here,
// not 16 — hence values that look large for body copy but are not.
const LABEL_TIERS = [
  { maxLength: 16, fontSize: '2.0rem', lineClamp: 2 },
  { maxLength: 34, fontSize: '1.7rem', lineClamp: 3 },
  { maxLength: Infinity, fontSize: '1.4rem', lineClamp: 3 }
];

const getLabelTier = labels => {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  return LABEL_TIERS.find(tier => longest <= tier.maxLength);
};

const TileLabel = styled('span', {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $fontSize, $lineClamp }) => ({
  fontSize: $fontSize,
  fontWeight: 700,
  lineHeight: 1.2,
  // No reserved height: grid items already stretch to their row, so tiles line
  // up without every short label paying for a second line it never uses.
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: $lineClamp,
  overflow: 'hidden',
  overflowWrap: 'anywhere',
  color: theme.palette.primary.main
}));

// Kept a clear step below the designation and in a muted tone: the date is the
// chronological anchor, not the identity of the issue.
const TileDate = styled('span')(({ theme }) => ({
  fontSize: '1.7rem',
  lineHeight: 1.2,
  color: theme.palette.text.secondary
}));

// Absolutely positioned so neither corner marker can shift the text, in any
// direction: a leading icon present on only part of the items destroys the
// alignment of all of them.
const TileCorner = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  display: 'inline-flex',
  lineHeight: 0
}));

// Type on the left, availability on the right — two different questions, two
// fixed places.
const TileTypeCorner = styled(TileCorner)(({ theme }) => ({
  insetInlineStart: theme.spacing(0.5),
  color: theme.palette.text.disabled
}));

const TileAvailabilityCorner = styled(TileCorner)(({ theme }) => ({
  insetInlineEnd: theme.spacing(0.5)
}));

// Memoized: a collection grid holds dozens to thousands of these, and every
// unrelated state change on the page (sort select, delete dialog, licenses
// arriving) would otherwise re-render all of them — Tooltip subtree included.
// All three props come from the store or from the memos below, so the bail-out
// is complete.
const DocumentTile = React.memo(({ doc, display, labelTier }) => {
  const fileName = getAttachedFileName(doc);
  const tooltip = [doc.title, hasOwnDescription(doc) ? doc.description : null]
    .filter(Boolean)
    .join(' — ');
  const TypeIcon = DOCUMENT_TYPE_ICONS[doc.type] ?? DOCUMENT_TYPE_FALLBACK_ICON;

  return (
    <Tooltip title={tooltip} enterDelay={400}>
      {/* The visible label is trimmed down to "No 47"; screen readers get the
          untouched title instead of the shortened form. */}
      <Tile to={`/ui/documents/${doc.id}`} aria-label={tooltip || undefined}>
        <TileTypeCorner>
          <TypeIcon fontSize="small" />
        </TileTypeCorner>
        {fileName && (
          <TileAvailabilityCorner>
            <AvailabilityMarker fileName={fileName} />
          </TileAvailabilityCorner>
        )}
        <TileLabel
          $fontSize={labelTier.fontSize}
          $lineClamp={labelTier.lineClamp}
        >
          {display.primary}
        </TileLabel>
        {display.secondary && <TileDate>{display.secondary}</TileDate>}
      </Tile>
    </Tooltip>
  );
});

DocumentTile.displayName = 'DocumentTile';

DocumentTile.propTypes = {
  doc: DocumentChildPropTypes.isRequired,
  display: PropTypes.shape({
    primary: PropTypes.string.isRequired,
    secondary: PropTypes.string
  }).isRequired,
  labelTier: PropTypes.shape({
    fontSize: PropTypes.string.isRequired,
    lineClamp: PropTypes.number.isRequired
  }).isRequired
};

export const DocumentChildrenTiles = ({ documents, collectionTitle }) => {
  // Resolved here rather than inside each tile, because the type size has to be
  // decided from the whole set before any tile renders.
  const items = useMemo(
    () =>
      (documents ?? []).map(doc => ({
        doc,
        display: getChildDisplay(doc, collectionTitle)
      })),
    [documents, collectionTitle]
  );
  const labelTier = useMemo(
    () => getLabelTier(items.map(item => item.display.primary)),
    [items]
  );

  if (items.length === 0) return null;
  return (
    <TilesGrid>
      {items.map(({ doc, display }) => (
        <DocumentTile
          key={doc.id}
          doc={doc}
          display={display}
          labelTier={labelTier}
        />
      ))}
    </TilesGrid>
  );
};

DocumentChildrenTiles.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes),
  collectionTitle: PropTypes.string
};

/* -------------------------------------------------------------------------- */
/* List — articles and other child documents                                  */
/* -------------------------------------------------------------------------- */

// Article titles are long and of very uneven length, so they get wide columns
// rather than the many narrow ones a list of issue numbers can use. A rule under
// each entry gives the ragged grid the structure a bibliographic listing needs —
// it is what tells the eye where one reference ends and the next begins.
const ChildrenGrid = styled(List)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  columnGap: theme.spacing(3),
  padding: 0
}));

const ChildItem = styled(ListItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  padding: theme.spacing(0.75, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minWidth: 0
}));

// Present on every single row — unlike a conditional marker it therefore cannot
// ruin the left edge of the column, and it says at a glance what kind of
// document the entry is.
const RowTypeIcon = styled('span')(({ theme }) => ({
  flex: '0 0 auto',
  display: 'inline-flex',
  marginTop: theme.spacing(0.25),
  color: theme.palette.text.disabled
}));

// The title has to win over the abstract under it — it was only one step above
// (16px medium against 14px regular), which at two lines each read as a single
// block of text. A larger, heavier line plus a small gap separates the two.
const ChildTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.6rem',
  fontWeight: 600,
  lineHeight: 1.3,
  marginBottom: theme.spacing(0.25),
  overflowWrap: 'anywhere'
}));

// Two lines: on an article the description is the abstract, so it is the reason
// to click. The full text stays on the title attribute.
const Description = styled(Typography)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

// Memoized for the same reason as DocumentTile: `doc` comes straight from the
// store, so re-rendering a row on an unrelated page state change only costs a
// pointless re-run of the linkify tokenizer over its description.
const DocumentChildRow = React.memo(({ doc }) => {
  const TypeIcon = DOCUMENT_TYPE_ICONS[doc.type] ?? DOCUMENT_TYPE_FALLBACK_ICON;
  return (
    <ChildItem>
      <RowTypeIcon>
        <TypeIcon fontSize="small" />
      </RowTypeIcon>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <ChildTitle component="div">
          <AppLink to={`/ui/documents/${doc.id}`} underline="hover">
            {doc.title}
          </AppLink>
          {/* The marker follows the title rather than preceding it: the type
              icon already owns the left gutter. */}
          <AvailabilityMarker
            fileName={getAttachedFileName(doc)}
            sx={{ ml: 0.5, verticalAlign: 'text-bottom' }}
          />
        </ChildTitle>
        {hasOwnDescription(doc) && (
          <Description
            variant="body2"
            component="div"
            color="text.secondary"
            title={doc.description}
          >
            <Linkify options={linkifyOptions}>{doc.description}</Linkify>
          </Description>
        )}
      </Box>
    </ChildItem>
  );
});

DocumentChildRow.displayName = 'DocumentChildRow';

DocumentChildRow.propTypes = { doc: DocumentChildPropTypes.isRequired };

const DocumentChildrenList = ({ documents }) => {
  if (!documents?.length) return null;
  return (
    <ChildrenGrid>
      {documents.map(doc => (
        <DocumentChildRow key={doc.id} doc={doc} />
      ))}
    </ChildrenGrid>
  );
};

DocumentChildrenList.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes)
};

export default DocumentChildrenList;
