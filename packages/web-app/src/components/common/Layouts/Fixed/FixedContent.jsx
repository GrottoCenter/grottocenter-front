import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isNil, is } from 'ramda';
import {
  Typography,
  Card as MuiCard,
  CardActions as MuiCardActions,
  CardContent as MuiCardContent,
  CardHeader,
  CircularProgress,
  Tooltip,
  ButtonGroup,
  Button,
  Skeleton
} from '@mui/material';
import { Print } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useReactToPrint } from 'react-to-print';
import CreateIcon from '@mui/icons-material/Create';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import {
  SnapshotButton,
  SnapshotPageButton
} from '../../../appli/Entry/Snapshots/UtilityFunction';

const isString = is(String);

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)};
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
const CardActionsBtn = styled(SnapshotButton)`
  margin-left: auto;
`;

const Title = styled('div')`
  display: flex;
  justify-content: flex-start;
`;
const TitleIcon = styled('div')(
  ({ theme }) => `
  margin-right: 6px;
  margin-top: 4px;

  ${theme.breakpoints.up('md')} {
    margin-top: 8px;
  }
`
);
const CardHeaderStyled = styled(CardHeader)`
  ${({ theme }) => theme.breakpoints.down('lg')} {
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 8px;
  }
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
  const handlePrint = useReactToPrint({
    content: () => printRef.current
  });
  return (
    <Card>
      <CardHeaderStyled
        action={
          <ButtonGroup color="primary">
            {!isNil(printRef) && (
              <Button
                style={{ verticalAlign: 'top' }}
                variant="outlined"
                aria-label={formatMessage({ id: 'Print' })}
                color="primary"
                onClick={handlePrint}>
                <Print />
              </Button>
            )}
            {onEdit && (
              <Tooltip
                title={formatMessage({
                  id: 'Edit properties'
                })}>
                <Button aria-label="edit" onClick={onEdit}>
                  <CreateIcon />
                </Button>
              </Tooltip>
            )}

            {!isNil(onChangeSubscribe) && (
              <Tooltip
                title={formatMessage({
                  id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
                })}>
                <Button
                  color={isSubscribed ? 'secondary' : 'primary'}
                  size="small"
                  aria-label="edit"
                  onClick={onChangeSubscribe}
                  startIcon={SubscribeIcon}>
                  {formatMessage({
                    id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
                  })}
                </Button>
              </Tooltip>
            )}
            {snapshot?.all && (
              <SnapshotPageButton
                id={snapshot.id}
                isNetwork={snapshot.isNetwork}
              />
            )}
          </ButtonGroup>
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
      {!isNil(footer) && (
        <CardActions disableSpacing>
          {footer}
          {snapshot && (
            <CardActionsBtn
              size="small"
              variant="outlined"
              color="primary"
              id={snapshot.id}
              type={snapshot.entity}
              content={snapshot.actualVersion}
              isNetwork={snapshot.isNetwork}
              showLabel
            />
          )}
        </CardActions>
      )}
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
    actualVersion: PropTypes.any,
    all: PropTypes.bool
  }),
  onChangeSubscribe: PropTypes.func,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string])
};

export default FixedContent;
