import PropTypes from 'prop-types';
import {
  ButtonGroup,
  Button,
  CircularProgress,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useIntl } from 'react-intl';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import DeleteForeverIcon from '@mui/icons-material/RemoveCircleRounded';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { useOnlineStatus } from '../../../hooks';
import OfflineDisabled from '../../common/OfflineDisabled';

const LoadingActionButton = () => (
  <ButtonGroup color="primary" size="small" orientation="vertical">
    <Button disabled color="primary">
      <CircularProgress size={20} />
    </Button>
  </ButtonGroup>
);

const ActionButtons = ({
  isLoading,
  isUpdating,
  setIsUpdating,
  isDeleted,
  canEdit,
  canDelete,
  // Permission to hard-delete an already soft-deleted entity. Defaults to
  // `canDelete` so existing callers keep their behaviour; callers whose API
  // restricts permanent deletion further (e.g. guidelines: admin-only) pass a
  // narrower value.
  canPermanentlyDelete = canDelete,
  snapshotEl,
  onDeletePress,
  onRestorePress,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isMoveLoading
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isOnline = useOnlineStatus();

  if (isLoading) return <LoadingActionButton />;

  const showReorder = onMoveUp && onMoveDown;

  // Every action here writes to the API (edit, delete, restore, reorder) or
  // fetches history, so the whole group goes down together offline. Disabling
  // at the group level lets MUI propagate it to each Button, and the wrapper
  // carries the explanation the per-button tooltips can no longer show
  // (a disabled button swallows the hover).
  //
  // Blanking those titles offline is what keeps MUI quiet: it warns for every
  // Tooltip whose child is a disabled <button>, and there are five of them.
  const actionTitle = id => (isOnline ? formatMessage({ id }) : '');

  const actions = (
    <ButtonGroup
      color="primary"
      size="small"
      disabled={!isOnline}
      orientation={isSmall ? 'vertical' : 'horizontal'}>
      {!isUpdating && canDelete && isDeleted && (
        <Tooltip title={actionTitle('Restore')}>
          <Button
            onClick={() => onRestorePress()}
            color="primary"
            aria-label={formatMessage({ id: 'restore' })}>
            <RestoreIcon />
          </Button>
        </Tooltip>
      )}
      {!isDeleted && canEdit && !isUpdating && (
        <Tooltip title={actionTitle('Edit')}>
          <Button
            onClick={() => setIsUpdating(true)}
            color="primary"
            aria-label={formatMessage({ id: 'edit' })}>
            <EditIcon />
          </Button>
        </Tooltip>
      )}
      {showReorder && !isUpdating && isMoveLoading && (
        <Button disabled color="primary">
          <CircularProgress size={20} />
        </Button>
      )}
      {showReorder && !isUpdating && !isMoveLoading && !isFirst && (
        <Tooltip title={actionTitle('Move up')}>
          <Button
            onClick={onMoveUp}
            color="primary"
            aria-label={formatMessage({ id: 'Move up' })}>
            <ArrowUpward fontSize="small" />
          </Button>
        </Tooltip>
      )}
      {showReorder && !isUpdating && !isMoveLoading && !isLast && (
        <Tooltip title={actionTitle('Move down')}>
          <Button
            onClick={onMoveDown}
            color="primary"
            aria-label={formatMessage({ id: 'Move down' })}>
            <ArrowDownward fontSize="small" />
          </Button>
        </Tooltip>
      )}
      {!isUpdating && snapshotEl}
      {!isUpdating && (isDeleted ? canPermanentlyDelete : canDelete) && (
        <Tooltip
          title={actionTitle(isDeleted ? 'Permanently delete' : 'Delete')}>
          <Button
            onClick={() => onDeletePress(isDeleted)}
            color="primary"
            aria-label={formatMessage({ id: 'delete' })}>
            {isDeleted ? <DeleteForeverIcon color="error" /> : <DeleteIcon />}
          </Button>
        </Tooltip>
      )}
    </ButtonGroup>
  );

  return <OfflineDisabled>{actions}</OfflineDisabled>;
};

export default ActionButtons;

ActionButtons.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  isUpdating: PropTypes.bool.isRequired,
  setIsUpdating: PropTypes.func.isRequired,
  isDeleted: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  canPermanentlyDelete: PropTypes.bool,
  snapshotEl: PropTypes.element.isRequired,
  onDeletePress: PropTypes.func.isRequired,
  onRestorePress: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  isMoveLoading: PropTypes.bool
};
