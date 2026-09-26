import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Marker, Popup } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ButtonBase,
  Divider,
  IconButton,
  Typography
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import OpenWithIcon from '@mui/icons-material/OpenWith';

import useOpenLink from '@/hooks/useOpenLink';
import CustomIcon from '@/components/common/CustomIcon';
import { makePointIcon } from './pointIcon';
import {
  MAP_CONTROL_BUTTON_SIZE,
  LEAFLET_CONTROL_MARGIN
} from './mapControls';

const documentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  label: PropTypes.string
});

const EMPTY_DOCUMENTS = [];

// Auto-pan padding so Leaflet never slides the popup under the top-left map
// controls (zoom, fullscreen, points toggle). The left value is derived from
// the control column geometry — edge margin + a button + a gap — so it stays
// correct if the buttons are resized; the rest is a plain viewport margin.
const AUTOPAN_GAP = 10;
const AUTOPAN_PADDING_TOP_LEFT = [
  LEAFLET_CONTROL_MARGIN + MAP_CONTROL_BUTTON_SIZE + AUTOPAN_GAP,
  LEAFLET_CONTROL_MARGIN
];
const AUTOPAN_PADDING_BOTTOM_RIGHT = [
  LEAFLET_CONTROL_MARGIN,
  LEAFLET_CONTROL_MARGIN
];

const docUrl = id => `/ui/documents/${id}`;

const MultiDoc = ({ documents, onOpen }) => {
  const { formatMessage } = useIntl();
  return (
    <Box sx={{ maxHeight: 260, overflow: 'auto' }}>
      {documents.map(d => (
        <ButtonBase
          key={d.id}
          onClick={() => onOpen(d.documentId)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: 1,
            px: 1,
            py: 0.5,
            borderRadius: 0.5,
            justifyContent: 'flex-start',
            '&:hover': { bgcolor: 'action.hover' }
          }}>
          <CustomIcon type="bibliography" size={20} />
          <Typography
            variant="body2"
            noWrap
            sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            {d.label ||
              formatMessage({ id: 'Document {id}' }, { id: d.documentId })}
          </Typography>
          <ChevronRightIcon
            fontSize="small"
            sx={{ color: 'action.active', opacity: 0.5 }}
          />
        </ButtonBase>
      ))}
    </Box>
  );
};

MultiDoc.propTypes = {
  documents: PropTypes.arrayOf(documentShape).isRequired,
  onOpen: PropTypes.func.isRequired
};

const PointMarker = ({
  point,
  position,
  onEdit = null,
  onStartMove = null,
  onMoved = null,
  isMoving = false
}) => {
  const { formatMessage } = useIntl();
  const openLink = useOpenLink();
  const theme = useTheme();
  const markerRef = useRef(null);

  const documents = point.documents ?? EMPTY_DOCUMENTS;
  const hasHeader =
    Boolean(point.label) || Boolean(onEdit) || Boolean(onStartMove);
  const moveHint = formatMessage({ id: 'Drag to move the point' });

  // Toggle "move" mode imperatively via the marker instance. react-leaflet does
  // not reliably enable dragging when the `draggable` prop flips (the drag
  // handler only exists when the marker was created draggable), and swapping the
  // marker's overlay child (Popup <-> Tooltip) breaks its reconciliation. So the
  // marker is created draggable (when movable) with dragging disabled, and we
  // enable/disable it here — closing the popup and showing a hint tooltip.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !marker.dragging) return undefined;
    if (isMoving) {
      marker.closePopup();
      marker.dragging.enable();
      marker
        .bindTooltip(moveHint, { permanent: true, direction: 'top' })
        .openTooltip();
    } else {
      marker.dragging.disable();
      marker.unbindTooltip();
    }
    return undefined;
  }, [isMoving, moveHint]);

  const icon = useMemo(
    () =>
      makePointIcon({
        color: theme.palette.primary.main,
        badgeColor: theme.palette.secondary.main,
        count: documents.length
      }),
    [theme.palette.primary.main, theme.palette.secondary.main, documents.length]
  );

  const handleOpen = documentId => openLink(docUrl(documentId));

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      draggable={Boolean(onMoved)}
      eventHandlers={
        onMoved ? { dragend: e => onMoved(e.target.getLatLng()) } : undefined
      }>
      <Popup
        autoPanPaddingTopLeft={AUTOPAN_PADDING_TOP_LEFT}
        autoPanPaddingBottomRight={AUTOPAN_PADDING_BOTTOM_RIGHT}>

        <Box sx={{ minWidth: 240, maxWidth: 320 }}>
          {hasHeader && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ flex: 1, minWidth: 0 }}>
                {point.label}
              </Typography>
              {onStartMove && (
                <IconButton
                  size="small"
                  onClick={onStartMove}
                  aria-label={formatMessage({ id: 'Move' })}>
                  <OpenWithIcon fontSize="small" />
                </IconButton>
              )}
              {onEdit && (
                <IconButton
                  size="small"
                  onClick={onEdit}
                  aria-label={formatMessage({ id: 'Edit point' })}>
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
          {hasHeader && documents.length > 0 && <Divider sx={{ my: 0.75 }} />}
          {documents.length > 0 && (
            <MultiDoc documents={documents} onOpen={handleOpen} />
          )}
        </Box>
      </Popup>
    </Marker>
  );
};

PointMarker.propTypes = {
  point: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
    label: PropTypes.string,
    documents: PropTypes.arrayOf(documentShape)
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onEdit: PropTypes.func,
  onStartMove: PropTypes.func,
  onMoved: PropTypes.func,
  isMoving: PropTypes.bool
};

export default PointMarker;
