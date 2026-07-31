import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useOnlineStatus } from '../../../hooks';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef(null);
  const label = formatMessage({ id: 'offlineIndicatorTitle' });
  const message = formatMessage({ id: 'offlineIndicator' });

  if (isOnline) return null;

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          ref={anchorRef}
          aria-label={label}
          color="warning"
          size="large"
          onClick={() => setIsOpen(true)}>
          <WifiOffIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={isOpen}
        anchorEl={anchorRef.current}
        onClose={() => setIsOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: '4px' } } }}>
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Typography variant="body2">{message}</Typography>
        </Box>
      </Popover>
    </>
  );
};

export default OfflineIndicator;
