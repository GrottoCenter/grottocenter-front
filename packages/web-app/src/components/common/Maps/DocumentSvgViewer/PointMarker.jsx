import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Marker, Popup } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import { Box, ButtonBase, Divider, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import useOpenLink from '@/hooks/useOpenLink';
import { makePointIcon } from './pointIcon';

const documentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  label: PropTypes.string
});

const EMPTY_DOCUMENTS = [];

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
          }}
        >
          <DescriptionIcon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography
            variant="body2"
            noWrap
            sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}
          >
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

const PointMarker = ({ point, position }) => {
  const openLink = useOpenLink();
  const theme = useTheme();

  const documents = point.documents ?? EMPTY_DOCUMENTS;

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
    <Marker position={position} icon={icon}>
      <Popup>
        <Box sx={{ minWidth: 240, maxWidth: 320 }}>
          {point.label && (
            <Typography variant="subtitle2" fontWeight={600}>
              {point.label}
            </Typography>
          )}
          {point.label && documents.length > 0 && <Divider sx={{ my: 0.75 }} />}
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
  position: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default PointMarker;
