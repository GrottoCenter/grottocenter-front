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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import ShareIcon from '@mui/icons-material/Share';

import { SnapshotButton } from '../../../appli/Entry/Snapshots/UtilityFunction';
import { useNotification } from '../../../../hooks';
import copyToClipboard from '../../../../helpers/clipboard';

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
  flex-direction: column;
  align-items: flex-start;
`;

const Title = styled('span')`
  display: inline-flex;
  align-items: center;
`;
const TitleIcon = styled('span')`
  margin-right: 6px;
  display: inline-flex;
`;
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
  isSubscribeLoading,
  onToggleExplored,
  isExplored,
  isExploredLoading,
  displayShare = false
}) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();

  const handleShare = async () => {
    const { origin, pathname } = window.location;
    const url = origin + pathname;
    const shareTitle = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await copyToClipboard(url);
          onSuccess(formatMessage({ id: 'Link copied!' }));
        }
      }
    } else {
      await copyToClipboard(url);
      onSuccess(formatMessage({ id: 'Link copied!' }));
    }
  };

  let SubscribeIcon = <CircularProgress size={20} />;
  if (!isSubscribeLoading) {
    if (isSubscribed) SubscribeIcon = <NotificationsActiveIcon />;
    else SubscribeIcon = <NotificationsNoneIcon />;
  }

  let ExploredIcon = <CircularProgress size={20} />;
  if (!isExploredLoading) {
    if (isExplored) ExploredIcon = <CheckCircleIcon />;
    else ExploredIcon = <CheckCircleOutlineIcon />;
  }
  const handlePrint = useReactToPrint({
    contentRef: printRef
  });
  return (
    <Card>
      <CardHeaderStyled
        action={
          <ButtonGroup color="primary">
            {!isNil(onToggleExplored) && (
              <Tooltip
                title={formatMessage({
                  id: isExplored
                    ? 'Remove from my explored caves'
                    : 'Add to my explored caves'
                })}>
                <Button
                  color={isExplored ? 'secondary' : 'primary'}
                  onClick={onToggleExplored}>
                  {ExploredIcon}
                </Button>
              </Tooltip>
            )}
            {!isNil(printRef) && (
              <Tooltip title={formatMessage({ id: 'Print' })}>
                <Button
                  aria-label={formatMessage({ id: 'Print' })}
                  onClick={handlePrint}>
                  <Print />
                </Button>
              </Tooltip>
            )}
            {displayShare && (
              <Tooltip title={formatMessage({ id: 'Copy link' })}>
                <Button
                  aria-label={formatMessage({ id: 'Copy link' })}
                  onClick={handleShare}>
                  <ShareIcon />
                </Button>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip
                title={formatMessage({
                  id: 'Edit properties'
                })}>
                <Button
                  aria-label={formatMessage({ id: 'edit' })}
                  onClick={onEdit}>
                  <CreateIcon />
                </Button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip
                title={formatMessage({
                  id: 'Delete'
                })}>
                <Button
                  aria-label={formatMessage({ id: 'delete' })}
                  onClick={onDelete}>
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
                  aria-label={formatMessage({ id: 'edit' })}
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
  isExplored: PropTypes.bool,
  isExploredLoading: PropTypes.bool,
  onToggleExplored: PropTypes.func,
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
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  displayShare: PropTypes.bool
};

export default FixedContent;
