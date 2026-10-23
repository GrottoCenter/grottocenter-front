import { useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForeverRounded';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';

import FormSubmissionError from '@/components/common/FormSubmissionError';
import {
  DELETED_ENTITIES,
  DeleteConfirmationDialog
} from '@/components/common/card/Deleted';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineDisabled from '../../common/OfflineDisabled';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import { useSnapshotUrl } from './Snapshots/UtilityFunction';

const ActionButtons = ({
  isLoading,
  isUpdating,
  setIsUpdating,
  isDeleted,
  canEdit,
  canDelete,
  canPermanentlyDelete = false,
  deleteError = null,
  restoreError = null,
  onDeleteReset,
  entityName,
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
  const isOnline = useOnlineStatus();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const entityType = {
    comments: DELETED_ENTITIES.comment,
    descriptions: DELETED_ENTITIES.description,
    histories: DELETED_ENTITIES.history,
    locations: DELETED_ENTITIES.location,
    riggings: DELETED_ENTITIES.rigging
  }[snapshotProps?.type];
  // The `?? { id: 0, type: '' }` keeps the destructuring inside useSnapshotUrl
  // safe when the caller has no snapshot to link to — the resulting URL is
  // ignored because the `snapshot` item is hidden below.
  const snapshotUrl = useSnapshotUrl(snapshotProps ?? { id: 0, type: '' });

  const showReorder = Boolean(onMoveUp && onMoveDown);

  const items = [
    {
      key: 'restore',
      icon: <RestoreIcon />,
      label: formatMessage({ id: 'Restore' }),
      onClick: onRestorePress,
      disabled: !isOnline,
      // Secondary so restore reads as the discreet counterpart to the
      // red "Permanently delete" sitting next to it on a deleted item,
      // matching the hierarchy used by the entity-level DeletedCard.
      color: 'secondary',
      hidden: !(!isUpdating && canDelete && isDeleted)
    },
    {
      key: 'edit',
      icon: <EditIcon />,
      label: formatMessage({ id: 'Edit' }),
      onClick: () => setIsUpdating(true),
      disabled: !isOnline,
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
      disabled: !isOnline,
      hidden: !(showReorder && !isUpdating && !isMoveLoading && !isFirst)
    },
    {
      key: 'move-down',
      icon: <ArrowDownward fontSize="small" />,
      label: formatMessage({ id: 'Move down' }),
      onClick: onMoveDown,
      disabled: !isOnline,
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
      onClick: () => setIsDeleteConfirmationOpen(true),
      disabled: !isOnline,
      destructive: true,
      hidden: !(!isUpdating && (isDeleted ? canPermanentlyDelete : canDelete))
    }
  ];

  return (
    <>
      <FormSubmissionError error={restoreError} />
      <OfflineDisabled>
        <ResponsiveActions
          items={items}
          loading={isLoading}
          loadingLabel={formatMessage({ id: 'Loading ...' })}
          size="small"
        />
      </OfflineDisabled>
      {entityType && isDeleteConfirmationOpen && (
        <DeleteConfirmationDialog
          entityType={entityType}
          entityId={snapshotProps.id}
          entityName={entityName ?? formatMessage({ id: entityType.str })}
          isOpen={isDeleteConfirmationOpen}
          isLoading={isLoading}
          error={deleteError}
          isPermanent={isDeleted}
          onClose={() => {
            setIsDeleteConfirmationOpen(false);
            onDeleteReset?.();
          }}
          onConfirmation={() => onDeletePress(isDeleted)}
        />
      )}
    </>
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
  deleteError: FormSubmissionError.propTypes.error,
  restoreError: FormSubmissionError.propTypes.error,
  onDeleteReset: PropTypes.func,
  entityName: PropTypes.string,
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
