import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Marker, Popup } from 'react-leaflet';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import copyToClipboard from '@/helpers/clipboard';
import { useNotification } from '@/hooks';
import useOpenLink from '@/hooks/useOpenLink';
import { makePinIcon } from './pinIcon';

const attachmentShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  anchorId: PropTypes.string.isRequired,
  label: PropTypes.string
});

const docUrl = id => `/ui/documents/${id}`;

const AnchorIdRow = ({ anchorId, onCopy }) => {
  const { formatMessage } = useIntl();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography
        component="code"
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'monospace',
          px: 0.75,
          py: 0.5,
          bgcolor: 'grey.100',
          color: 'text.secondary',
          borderRadius: 0.5,
          overflow: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        #{anchorId}
      </Typography>
      <Tooltip title={formatMessage({ id: 'Copy ID' })}>
        <IconButton size="small" onClick={onCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

AnchorIdRow.propTypes = {
  anchorId: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired
};

const SingleDoc = ({ attachment, onOpen }) => {
  const { formatMessage } = useIntl();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        {formatMessage({ id: 'Open' })}
      </Button>
    </Box>
  );
};

SingleDoc.propTypes = {
  attachment: attachmentShape.isRequired,
  onOpen: PropTypes.func.isRequired
};

const MultiDoc = ({ attachments, onOpen }) => {
  const { formatMessage } = useIntl();
  return (
    <Box sx={{ maxHeight: 260, overflow: 'auto' }}>
      {attachments.map(a => (
        <ButtonBase
          key={a.id}
          onClick={() => onOpen(a.documentId)}
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
            {a.label ||
              formatMessage({ id: 'Document {id}' }, { id: a.documentId })}
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
  attachments: PropTypes.arrayOf(attachmentShape).isRequired,
  onOpen: PropTypes.func.isRequired
};

const AnchorPin = ({ anchorId, attachments, position }) => {
  const { formatMessage } = useIntl();
  const openLink = useOpenLink();
  const { onSuccess, onError } = useNotification();
  const theme = useTheme();

  const icon = useMemo(
    () =>
      makePinIcon({
        color: theme.palette.primary.main,
        badgeColor: theme.palette.secondary.main,
        count: attachments.length
      }),
    [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      attachments.length
    ]
  );

  const handleCopy = async () => {
    try {
      await copyToClipboard(anchorId);
      onSuccess(
        formatMessage({ id: 'Anchor ID {id} copied' }, { id: anchorId })
      );
    } catch (e) {
      onError(formatMessage({ id: 'Copy failed' }));
    }
  };
  const handleOpen = documentId => openLink(docUrl(documentId));

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <Box sx={{ minWidth: 240, maxWidth: 320 }}>
          <AnchorIdRow anchorId={anchorId} onCopy={handleCopy} />
          {attachments.length > 0 && <Divider sx={{ my: 0.75 }} />}
          {attachments.length === 1 && (
            <SingleDoc attachment={attachments[0]} onOpen={handleOpen} />
          )}
          {attachments.length > 1 && (
            <MultiDoc attachments={attachments} onOpen={handleOpen} />
          )}
        </Box>
      </Popup>
    </Marker>
  );
};

AnchorPin.propTypes = {
  anchorId: PropTypes.string.isRequired,
  attachments: PropTypes.arrayOf(attachmentShape).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default AnchorPin;
