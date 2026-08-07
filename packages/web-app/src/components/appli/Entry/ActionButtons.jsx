import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import DeleteForeverIcon from '@mui/icons-material/RemoveCircleRounded';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';

import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import OfflineDisabled from '../../common/OfflineDisabled';
import { useSnapshotUrl } from './Snapshots/UtilityFunction';

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
  snapshotProps,
  onDeletePress,
  onRestorePress,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isMoveLoading
}) => {
  const { formatMessage } = useIntl();
  // The `?? { id: 0, type: '' }` keeps the destructuring inside useSnapshotUrl
  // safe when the caller has no snapshot to link to — the resulting URL is
  // ignored because the `snapshot` item is hidden below.
  const snapshotUrl = useSnapshotUrl(snapshotProps ?? { id: 0, type: '' });

  if (isLoading) {
    return (
      <OfflineDisabled>
        <ResponsiveActions
          loading
          loadingLabel={formatMessage({ id: 'Loading ...' })}
        />
      </OfflineDisabled>
    );
  }

  const showReorder = Boolean(onMoveUp && onMoveDown);

  const items = [
    {
      key: 'restore',
      icon: <RestoreIcon />,
      label: formatMessage({ id: 'Restore' }),
      onClick: onRestorePress,
      hidden: !(!isUpdating && canDelete && isDeleted)
    },
    {
      key: 'edit',
      icon: <EditIcon />,
      label: formatMessage({ id: 'Edit' }),
      onClick: () => setIsUpdating(true),
      hidden: !(!isDeleted && canEdit && !isUpdating)
    },
    {
      key: 'move-loading',
      icon: <CircularProgress size={20} />,
      label: formatMessage({ id: 'Loading ...' }),
      disabled: true,
      busy: true,
      hidden: !(showReorder && !isUpdating && isMoveLoading)
    },
    {
      key: 'move-up',
      icon: <ArrowUpward fontSize="small" />,
      label: formatMessage({ id: 'Move up' }),
      onClick: onMoveUp,
      hidden: !(showReorder && !isUpdating && !isMoveLoading && !isFirst)
    },
    {
      key: 'move-down',
      icon: <ArrowDownward fontSize="small" />,
      label: formatMessage({ id: 'Move down' }),
      onClick: onMoveDown,
      hidden: !(showReorder && !isUpdating && !isMoveLoading && !isLast)
    },
    {
      key: 'snapshot',
      icon: <HistoryIcon />,
      label: formatMessage({ id: 'History' }),
      href: snapshotUrl,
      hidden: !(!isUpdating && snapshotProps)
    },
    {
      key: 'delete',
      icon: isDeleted ? <DeleteForeverIcon color="error" /> : <DeleteIcon />,
      label: formatMessage({
        id: isDeleted ? 'Permanently delete' : 'Delete'
      }),
      onClick: () => onDeletePress(isDeleted),
      destructive: true,
      hidden: !(!isUpdating && (isDeleted ? canPermanentlyDelete : canDelete))
    }
  ];

  return (
    <OfflineDisabled>
      <ResponsiveActions items={items} />
    </OfflineDisabled>
  );
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
  // Everything the snapshot page needs to build its URL. Omit entirely to hide
  // the history action.
  snapshotProps: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    isNetwork: PropTypes.bool,
    getAll: PropTypes.bool,
    parentId: PropTypes.number,
    parentType: PropTypes.string,
    isDeleted: PropTypes.bool
  }),
  onDeletePress: PropTypes.func.isRequired,
  onRestorePress: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  isMoveLoading: PropTypes.bool
};
