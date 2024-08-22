import PropTypes from 'prop-types';
import React from 'react';
import { ButtonGroup, Button, Tooltip } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useIntl } from 'react-intl';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import DeleteForeverIcon from '@mui/icons-material/RemoveCircleRounded';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';

const LoadingActionButton = () => {
  const { formatMessage } = useIntl();
  return (
    <ButtonGroup color="primary">
      <LoadingButton
        loading
        loadingIndicator={formatMessage({ id: 'Loading ...' })}>
        {formatMessage({ id: 'Loading ...' })}
      </LoadingButton>
    </ButtonGroup>
  );
};

const ActionButtons = ({
  isLoading,
  isUpdating,
  setIsUpdating,
  isDeleted,
  canEdit,
  canDelete,
  snapshotEl,
  onDeletePress,
  onRestorePress
}) => {
  const { formatMessage } = useIntl();

  if (isLoading) return <LoadingActionButton />;

  return (
    <ButtonGroup color="primary">
      {!isUpdating && canDelete && isDeleted && (
        <Tooltip title={formatMessage({ id: 'Restore' })}>
          <Button
            onClick={() => onRestorePress()}
            color="primary"
            aria-label="restore">
            <RestoreIcon />
          </Button>
        </Tooltip>
      )}
      {!isUpdating && canDelete && (
        <Tooltip
          title={
            isDeleted
              ? formatMessage({ id: 'Permanently delete' })
              : formatMessage({ id: 'Delete' })
          }>
          <Button
            onClick={() => onDeletePress(isDeleted)}
            color="primary"
            aria-label="delete">
            {isDeleted ? <DeleteForeverIcon color="error" /> : <DeleteIcon />}
          </Button>
        </Tooltip>
      )}
      {!isDeleted && (
        <Tooltip
          title={
            isUpdating
              ? formatMessage({ id: 'Cancel edit' })
              : formatMessage({ id: `Edit` })
          }>
          <Button
            disabled={!canEdit}
            onClick={() => setIsUpdating(!isUpdating)}
            color="primary"
            aria-label="edit">
            {isUpdating ? formatMessage({ id: `Cancel` }) : <EditIcon />}
          </Button>
        </Tooltip>
      )}
      {!isUpdating && snapshotEl}
    </ButtonGroup>
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
  snapshotEl: PropTypes.element.isRequired,
  onDeletePress: PropTypes.func.isRequired,
  onRestorePress: PropTypes.func.isRequired
};
