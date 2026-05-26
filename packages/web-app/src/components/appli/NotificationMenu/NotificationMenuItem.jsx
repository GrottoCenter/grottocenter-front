import React from 'react';
import { Box, ListItemIcon, MenuItem, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import UnreadNotificationIcon from '@mui/icons-material/FiberManualRecord';
import formatNotification from '../../../utils/formatNotification';

const ICON_WIDTH = '2.5rem';
const Icon = styled('img')`
  width: ${ICON_WIDTH};
`;

const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: (prop) => !prop.startsWith('$')
})(({ $isRead, theme }) => ({
  background: !$isRead && theme.palette.secondary.veryLight,
  whiteSpace: 'normal',
  width: '100%',
  margin: 0,
  borderRadius: 0
}));

const NotificationsMenuItem = ({ notification, onClick }) => {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const {
    dateInscription,
    entityName,
    entityType,
    iconPath,
    isRead,
    link,
    notifier,
    verb
  } = formatNotification(notification);

  const handleOnClick = () => {
    onClick(notification);
  };

  return (
    <StyledMenuItem
      dense
      $isRead={isRead}
      component={Link}
      to={link}
      onClick={handleOnClick}>
      {iconPath && (
        <ListItemIcon style={{ minWidth: `calc(${ICON_WIDTH} + 4px)` }}>
          <Icon src={iconPath} />
        </ListItemIcon>
      )}
      <Box>
        <Typography>
          <b>{entityName}</b>
          &nbsp;
          <span style={{ fontSize: '85%' }}>
            {formatMessage(
              {
                id: 'entity.action',
                defaultMessage: '{entity} {verb}'
              },
              {
                entity: `(${formatMessage({ id: entityType })})`,
                verb: formatMessage({ id: verb })
              }
            )}
            .
          </span>
        </Typography>
        <Typography
          onMouseDown={e => e.stopPropagation()}
          color="textSecondary"
          variant="caption">
          {formatMessage(
            {
              id: '{dateDay} at {dateHour} by {nickname}',
              defaultMessage: '{dateDay} at {dateHour} by {nickname}'
            },
            {
              dateDay: formatDate(dateInscription),
              dateHour: formatTime(dateInscription),
              nickname: <b key="nickname">{notifier.nickname}</b>
            }
          )}
        </Typography>
      </Box>
      {!isRead && (
        <Box display="flex" justifyContent="flex-end" flex={1}>
          <UnreadNotificationIcon color="secondary" fontSize="small" />
        </Box>
      )}
    </StyledMenuItem>
  );
};

NotificationsMenuItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
  onClick: PropTypes.func
};

export default NotificationsMenuItem;
