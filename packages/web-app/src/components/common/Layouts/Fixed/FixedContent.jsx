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
import DeleteIcon from '@mui/icons-material/Delete';
import TimelineIcon from '@mui/icons-material/Timeline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import { SnapshotButton } from '../../../appli/Entry/Snapshots/UtilityFunction';

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
  onDelete,
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
    contentRef: () => printRef.current
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
            {onDelete && (
              <Tooltip
                title={formatMessage({
                  id: 'Delete'
                })}>
                <Button aria-label="delete" onClick={onDelete}>
                  <DeleteIcon />
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
            {!!snapshot && (
              <SnapshotButton
                id={snapshot.id}
                type={snapshot.type}
                content={snapshot.content}
                isNetwork={snapshot.isNetwork}
                getAll={snapshot.getAll}
                startIcon={<TimelineIcon />}
                label={formatMessage({ id: 'All Revisions' })}
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
      {!isNil(footer) && <CardActions disableSpacing>{footer}</CardActions>}
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
  onDelete: PropTypes.func,
  printRef: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    current: PropTypes.any
  }),
  snapshot: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string,
    content: PropTypes.shape({}),
    isNetwork: PropTypes.bool,
    getAll: PropTypes.bool
  }),
  onChangeSubscribe: PropTypes.func,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string])
};

export default FixedContent;
