import React from 'react';
import { Box, ListItemIcon, MenuItem, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import UnreadNotificationIcon from '@material-ui/icons/FiberManualRecord';
import formatNotification from './formatNotification';

const ICON_WIDTH = '2.5rem';
const Icon = styled.img`
  width: ${ICON_WIDTH};
`;

const StyledMenuItem = styled(MenuItem)`
  ${({ $isRead, theme, $width }) => `
    background: ${!$isRead && theme.palette.secondary.veryLight};
    white-space: normal;
    width: ${$width}px;
  `}
`;

const NotificationsMenuItem = ({ notification, onClick, width }) => {
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
      $width={width}
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
                id: `{entity} ${verb}`,
                defaultMessage: `{entity} ${verb}`
              },
              {
                entity: `(${formatMessage({ id: entityType })})`
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
              nickname: <b>{notifier.nickname}</b>
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
  onClick: PropTypes.func,
  width: PropTypes.number.isRequired
};

export default NotificationsMenuItem;
