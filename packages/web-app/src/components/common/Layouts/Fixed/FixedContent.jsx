import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isNil, is } from 'ramda';
import {
  Typography,
  Card as MuiCard,
  CardActions as MuiCardActions,
  IconButton as MuiIconButton,
  CardContent as MuiCardContent,
  CardHeader,
  CircularProgress,
  Tooltip
} from '@material-ui/core';
import styled from 'styled-components';
import CreateIcon from '@material-ui/icons/Create';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import { Skeleton } from '@material-ui/lab';

const isString = is(String);

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)}px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CardContent = styled(MuiCardContent)`
  flex-grow: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

const CardActions = styled(MuiCardActions)`
  display: flex;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
`;

const IconButton = styled(MuiIconButton)`
  margin-left: auto;
`;

const FixedContent = ({
  avatar,
  subheader,
  title,
  icon,
  content,
  footer,
  onEdit,
  onChangeSubscribe,
  isSubscribed,
  isSubscribeLoading
}) => {
  const { formatMessage } = useIntl();
  let SubscribeIcon = <CircularProgress size="small" />;
  if (!isSubscribeLoading) {
    if (isSubscribed) SubscribeIcon = <NotificationsActiveIcon />;
    else SubscribeIcon = <NotificationsNoneIcon />;
  }
  return (
    <Card>
      <CardHeader
        action={
          <>
            {!isNil(onEdit) && (
              <IconButton
                color="primary"
                size="small"
                aria-label="edit"
                onClick={onEdit}>
                <CreateIcon />
              </IconButton>
            )}
            {!isNil(onChangeSubscribe) && (
              <Tooltip
                title={formatMessage({
                  id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
                })}>
                <IconButton
                  color={isSubscribed ? 'secondary' : 'primary'}
                  size="small"
                  aria-label="edit"
                  onClick={onChangeSubscribe}>
                  {SubscribeIcon}
                </IconButton>
              </Tooltip>
            )}
          </>
        }
        avatar={avatar}
        subheader={subheader}
        title={
          isString(title) ? (
            <Title>
              <Typography variant="h1" color="secondary">
                {title}
              </Typography>
              {!isNil(icon) && icon}
            </Title>
          ) : (
            <Skeleton />
          )
        }
      />
      <CardContent>{content}</CardContent>
      {!isNil(footer) && <CardActions disableSpacing> {footer}</CardActions>}
    </Card>
  );
};

FixedContent.propTypes = {
  avatar: PropTypes.node,
  content: PropTypes.node.isRequired,
  footer: PropTypes.node,
  icon: PropTypes.node,
  isSubscribed: PropTypes.bool,
  isSubscribeLoading: PropTypes.bool,
  onEdit: PropTypes.func,
  onChangeSubscribe: PropTypes.func,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]).isRequired
};

export default FixedContent;
