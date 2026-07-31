import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  List,
  ListItem,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LinkIcon from '@mui/icons-material/Link';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Linkify from 'linkify-react';
import { find } from 'linkifyjs';

import AppLink from '@/components/common/AppLink';
import { getFileIcon } from '@/components/common/DocumentsList/utils/fileIcons';
import linkifyOptions from '@/helpers/linkifyOptions';
import { CHILDREN_SORT_ORDERS } from '@/utils/documentChildrenSort';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON
} from '@/utils/documentTypeHelpers';
import {
  getChildLabel,
  getPublicationYear
} from '@/utils/documentChildrenLabel';
import { DocumentChildPropTypes } from '@/types/document.type';

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

const AVAILABILITY = { FILE: 'file', LINK: 'link', NONE: 'none' };

const getAvailability = doc => {
  const file = doc.files?.[0];
  // Fall back to completePath: some payloads carry the path without a
  // separate fileName, and keying only on fileName silently disabled the
  // whole file branch of the indicator.
  const fileName = file?.fileName ?? file?.completePath;
  if (fileName) return { kind: AVAILABILITY.FILE, fileName };
  // Legacy imports frequently carry the document URL inside the free-text
  // description rather than as an attached file — that still counts as
  // "you can read it".
  if (doc.description && find(doc.description, 'url').length > 0)
    return { kind: AVAILABILITY.LINK };
  return { kind: AVAILABILITY.NONE };
};

// Only the positive states are marked: flagging "nothing attached" would put an
// identical icon on ~90% of the rows, which is the noise this indicator exists
// to replace. The legend below makes the absence readable instead.
const availabilityIcon = availability =>
  availability.kind === AVAILABILITY.FILE ? (
    getFileIcon(availability.fileName)
  ) : (
    <LinkIcon fontSize="small" color="primary" />
  );

// A flex row in its own right, not an inline-flex inside a Typography block:
// an inline box sits on its parent's baseline and reserves descender space
// below itself, making the legend taller than the sort control next to it — so
// centring the two in the header left their texts visibly out of line.
const LegendRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1
}));

const LegendEntry = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  lineHeight: 1
}));

// Without a legend the marker is a private code: a reader cannot tell an
// unmarked row from an unimplemented feature. It only appears when at least one
// document in the list actually carries a marker.
export const ChildrenAvailabilityLegend = ({ documents }) => {
  const { formatMessage } = useIntl();
  const kinds = new Set(
    (documents ?? []).map(doc => getAvailability(doc).kind)
  );
  const entries = [
    kinds.has(AVAILABILITY.FILE) && {
      key: AVAILABILITY.FILE,
      icon: <InsertDriveFileIcon fontSize="small" color="action" />,
      label: formatMessage({ id: 'File available' })
    },
    kinds.has(AVAILABILITY.LINK) && {
      key: AVAILABILITY.LINK,
      icon: <LinkIcon fontSize="small" color="primary" />,
      label: formatMessage({ id: 'External link available' })
    }
  ].filter(Boolean);
  if (entries.length === 0) return null;

  return (
    <LegendRow>
      {entries.map(entry => (
        <LegendEntry key={entry.key}>
          {entry.icon}
          {entry.label}
        </LegendEntry>
      ))}
    </LegendRow>
  );
};

ChildrenAvailabilityLegend.propTypes = {
  documents: PropTypes.arrayOf(DocumentChildPropTypes)
};

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

const normalize = value =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Imported children very often repeat the collection name as their description
// ("Scialet" under "Scialet No 47 (2018)"). Repeated on every row it is pure
// noise. Keep the description only when it says something the title does not.
const hasOwnDescription = doc => {
  const description = normalize(doc.description);
  return description !== '' && !normalize(doc.title).includes(description);
};

/* -------------------------------------------------------------------------- */
/* Tiles — a collection's issues                                              */
/* -------------------------------------------------------------------------- */

// A shelf of volumes. The issue designation leads — it is what identifies the
// item — and the publication year sits under it as the chronological anchor.
// Both come from data: the year from datePublication, the designation from the
// title stripped of everything already displayed around it. Tiles reflow from 2
// columns on a phone to 6 on a wide screen without any breakpoint.
const TilesGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
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
// from across the grid, so it gets a display size. When a collection's titles
// do not follow that pattern the label can be a whole phrase, which at that
// size would be clipped after two or three words — it steps down instead of
// forcing every tile to be sized for the worst case.
const LARGE_LABEL_MAX_LENGTH = 10;

const TileLabel = styled('span', {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $compact }) => ({
  fontSize: $compact ? '1.15rem' : '1.6rem',
  fontWeight: 700,
  lineHeight: 1.2,
  // No reserved height: grid items already stretch to their row, so tiles line
  // up without every short label paying for a second line it never uses.
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  // Three lines: a designation never needs more than one, so this only ever
  // spends height on the collections whose titles are actual phrases — and it
  // is what keeps those from being cut mid-word.
  WebkitLineClamp: 3,
  overflow: 'hidden',
  overflowWrap: 'anywhere',
  color: theme.palette.primary.main
}));

// Kept a clear step below the designation and in a muted tone: the year is the
// chronological anchor, not the identity of the issue.
const TileYear = styled('span')(({ theme }) => ({
  fontSize: '1.4rem',
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

const DocumentTile = ({ doc, collectionTitle }) => {
  const availability = getAvailability(doc);
  const year = getPublicationYear(doc.datePublication);
  const label = getChildLabel(doc, collectionTitle);
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
        {availability.kind !== AVAILABILITY.NONE && (
          <TileAvailabilityCorner>
            {availabilityIcon(availability)}
          </TileAvailabilityCorner>
        )}
        <TileLabel $compact={label.length > LARGE_LABEL_MAX_LENGTH}>
          {label}
        </TileLabel>
        <TileYear>{year ?? '—'}</TileYear>
      </Tile>
    </Tooltip>
  );
};

DocumentTile.propTypes = {
  doc: DocumentChildPropTypes.isRequired,
  collectionTitle: PropTypes.string
};

export const DocumentChildrenTiles = ({ documents, collectionTitle }) => {
  if (!documents?.length) return null;
  return (
    <TilesGrid>
      {documents.map(doc => (
        <DocumentTile
          key={doc.id}
          doc={doc}
          collectionTitle={collectionTitle}
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
  display: 'block',
  padding: theme.spacing(0.75, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  minWidth: 0
}));

const ChildTitle = styled(Typography)`
  font-weight: 500;
  overflow-wrap: anywhere;
`;

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

// The marker follows the title instead of preceding it: a leading icon present
// on only a few rows hangs into the margin and destroys the left edge of every
// column.
const InlineMarker = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  verticalAlign: 'text-bottom',
  marginInlineStart: theme.spacing(0.5),
  lineHeight: 0
}));

const DocumentChildRow = ({ doc }) => {
  const availability = getAvailability(doc);
  return (
    <ChildItem>
      <ChildTitle component="div">
        <AppLink to={`/ui/documents/${doc.id}`} underline="hover">
          {doc.title}
        </AppLink>
        {availability.kind !== AVAILABILITY.NONE && (
          <InlineMarker>{availabilityIcon(availability)}</InlineMarker>
        )}
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
    </ChildItem>
  );
};

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

/* -------------------------------------------------------------------------- */
/* Sort control                                                               */
/* -------------------------------------------------------------------------- */

export const ChildrenSortSelect = ({ value, onChange }) => {
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
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

// Wraps on narrow screens instead of squeezing the title against the control.
export const ChildrenSectionHeader = ({ title, legend, action }) => (
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
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 2,
        rowGap: 0.5,
        marginInlineStart: 'auto'
      }}
    >
      {legend}
      {action}
    </Box>
  </Box>
);

ChildrenSectionHeader.propTypes = {
  title: PropTypes.node,
  legend: PropTypes.node,
  action: PropTypes.node
};

export default DocumentChildrenList;
