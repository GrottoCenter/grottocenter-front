import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Marker, Popup } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import useOpenLink from '../../../../hooks/useOpenLink';
import { makeDocPinIcon } from './pinIcon';

const attachmentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  anchorId: PropTypes.string.isRequired,
  label: PropTypes.string
});

const docUrl = id => `/ui/documents/${id}`;

const SinglePopup = ({ attachment, onOpen }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
    {attachment.label && (
      <Typography variant="body2" fontWeight={500}>
        {attachment.label}
      </Typography>
    )}
    <Button
      size="small"
      variant="contained"
      startIcon={<DescriptionIcon fontSize="small" />}
      onClick={() => onOpen(attachment.documentId)}
    >
      Ouvrir
    </Button>
  </Box>
);

SinglePopup.propTypes = {
  attachment: attachmentShape.isRequired,
  onOpen: PropTypes.func.isRequired
};

const MultiPopup = ({ attachments, onOpen }) => (
  <Box sx={{ minWidth: 240, maxWidth: 320, m: -1 }}>
    <Typography
      variant="overline"
      color="text.secondary"
      component="div"
      sx={{ px: 2, pt: 1.5, pb: 0.5, lineHeight: 1.2 }}
    >
      {attachments.length} documents
    </Typography>
    <List dense disablePadding sx={{ maxHeight: 260, overflow: 'auto' }}>
      {attachments.map((a, i) => (
        <Fragment key={a.id}>
          {i > 0 && <Divider component="li" />}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => onOpen(a.documentId)}
              sx={{ py: 1, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>
                <DescriptionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={a.label || `Document ${a.documentId}`}
                slotProps={{
                  primary: { variant: 'body2', noWrap: true }
                }}
              />
              <ChevronRightIcon
                fontSize="small"
                sx={{ color: 'action.active', opacity: 0.5, ml: 1 }}
              />
            </ListItemButton>
          </ListItem>
        </Fragment>
      ))}
    </List>
  </Box>
);

MultiPopup.propTypes = {
  attachments: PropTypes.arrayOf(attachmentShape).isRequired,
  onOpen: PropTypes.func.isRequired
};

const DocumentPin = ({ attachments, position }) => {
  const openLink = useOpenLink();
  const theme = useTheme();
  const icon = useMemo(
    () => makeDocPinIcon(theme.palette.primary.main, attachments.length),
    [theme.palette.primary.main, attachments.length]
  );
  const handleOpen = documentId => openLink(docUrl(documentId));

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        {attachments.length === 1 ? (
          <SinglePopup attachment={attachments[0]} onOpen={handleOpen} />
        ) : (
          <MultiPopup attachments={attachments} onOpen={handleOpen} />
        )}
      </Popup>
    </Marker>
  );
};

DocumentPin.propTypes = {
  attachments: PropTypes.arrayOf(attachmentShape).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default DocumentPin;
