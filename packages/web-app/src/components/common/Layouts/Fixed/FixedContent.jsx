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
import { Print } from '@material-ui/icons';
import styled from 'styled-components';
import ReactToPrint from 'react-to-print';
import CreateIcon from '@material-ui/icons/Create';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import { Skeleton } from '@material-ui/lab';
import { SnapshotButton } from '../../../appli/Entry/Snapshots/UtilityFunction';

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
  justify-content: flex-start;
`;
const TitleIcon = styled.div(
  ({ theme }) => `
  margin-right: 6px;
  margin-top: 4px;

  ${theme.breakpoints.up('md')} {
    margin-top: 8px;
  }
`
);

const IconButton = styled(MuiIconButton)`
  margin-right: 7px;
  margin-top: 7px;
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
  printRef,
  snapshot,
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
            {!isNil(printRef) && (
              <ReactToPrint
                trigger={() => (
                  <IconButton
                    aria-label={formatMessage({ id: 'Print' })}
                    color="primary">
                    <Print />
                  </IconButton>
                )}
                content={() => printRef.current}
              />
            )}
            {snapshot && (
              <SnapshotButton
                id={snapshot.id}
                type={snapshot.entity}
                content={snapshot.actualVersion}
                isNetwork={snapshot.isNetwork}
              />
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
              {!isNil(icon) && <TitleIcon>{icon}</TitleIcon>}
              <Typography variant="h1" color="secondary">
                {title}
              </Typography>
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
  printRef: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    current: PropTypes.any
  }),
  snapshot: PropTypes.shape({
    id: PropTypes.number.isRequired,
    entity: PropTypes.string.isRequired,
    isNetwork: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    actualVersion: PropTypes.any
  }),
  onChangeSubscribe: PropTypes.func,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]).isRequired
};

export default FixedContent;
