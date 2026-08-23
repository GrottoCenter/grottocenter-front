import { Box, ListItemIcon, MenuItem, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import UnreadNotificationIcon from '@mui/icons-material/FiberManualRecord';
import PublishIcon from '@mui/icons-material/Publish';
import AppLink from '../../common/AppLink';
import formatNotification from '../../../utils/formatNotification';

const ICON_WIDTH = '1.5625rem';
const Icon = styled('img')`
  width: ${ICON_WIDTH};
`;

const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ $isRead, theme }) => ({
  background: !$isRead && theme.palette.secondary.veryLight,
  whiteSpace: 'normal',
  width: '100%',
  margin: 0,
  borderRadius: 0
}));

// Pick the icon + title + action-text triplet for the row from the notification
// type. Entity events go through the standard "iconPath + entityName +
// (entityType) verb" path; IMPORT_COMPLETE bypasses that entity-shaped triplet
// because it has no entity — the util leaves entityName/entityType/iconPath
// empty on purpose, so trying to render them generically would look broken.
const buildRowContent = (formatted, formatMessage) => {
  if (formatted.notificationType === 'IMPORT_COMPLETE') {
    return {
      icon: <PublishIcon />,
      title: formatMessage({ id: 'CSV Import' }),
      actionText: `${formatMessage({ id: formatted.verb, defaultMessage: formatted.verb })}.`
    };
  }

  const { entityName, entityType, iconPath, verb } = formatted;
  const typePart = entityType
    ? `(${formatMessage({ id: entityType, defaultMessage: entityType })}) `
    : '';
  const verbPart = verb
    ? formatMessage({ id: verb, defaultMessage: verb })
    : '';
  return {
    icon: iconPath ? <Icon src={iconPath} /> : null,
    title: entityName,
    actionText: `${typePart}${verbPart}.`
  };
};

const NotificationsMenuItem = ({ notification, onClick }) => {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const formatted = formatNotification(notification);
  const { dateInscription, isRead, link, notifier } = formatted;
  const { icon, title, actionText } = buildRowContent(formatted, formatMessage);

  const handleOnClick = () => {
    onClick(notification);
  };

  return (
    <StyledMenuItem
      dense
      $isRead={isRead}
      component={AppLink}
      to={link}
      onClick={handleOnClick}>
      {icon && (
        <ListItemIcon style={{ minWidth: `calc(${ICON_WIDTH} + 4px)` }}>
          {icon}
        </ListItemIcon>
      )}
      <Box>
        <Typography>
          <b>{title}</b>
          &nbsp;
          <span style={{ fontSize: '85%' }}>{actionText}</span>
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
