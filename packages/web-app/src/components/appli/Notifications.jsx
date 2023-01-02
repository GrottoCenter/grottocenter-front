import React from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Notifications = () => (
  <Badge badgeContent={1} secondary badgeStyle={{ top: 20, right: 20 }}>
    <IconButton tooltip="Notifications" size="large">
      <NotificationsIcon />
    </IconButton>
  </Badge>
);

export default Notifications;
