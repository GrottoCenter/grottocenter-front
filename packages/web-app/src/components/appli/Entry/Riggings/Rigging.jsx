import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  useUpdateRigging,
  useDeleteRigging,
  useRestoreRigging,
  usePermissions
} from '../../../../hooks';
import ActionButtons from '../ActionButtons';
import CreateRiggingsForm from '../../EntitiesForm/Riggings';
import { RiggingPropTypes } from '../../../../types/entrance.type';
import Contribution from '../../../common/Contribution/Contribution';
import RiggingTable from './RiggingTable';
import DiscardChangesDialog from '../../../common/DiscardChangesDialog';

const Rigging = ({
  rigging,
  entranceId,
  isEditAllowed,
  isMoving,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const permissions = usePermissions();
  const updateMutation = useUpdateRigging();
  const deleteMutation = useDeleteRigging();
  const restoreMutation = useRestoreRigging();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(rigging.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForm = () => {
    setIsUpdateFormVisible(false);
    setIsFormDirty(false);
    setIsDiscardDialogOpen(false);
  };
  const handleCancel = () => {
    if (isFormDirty) {
      setIsDiscardDialogOpen(true);
    } else {
      closeForm();
    }
  };
  const onSubmitUpdateForm = data => {
    updateMutation.mutate({ ...data, language: data.language });
    closeForm();
  };
  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    deleteMutation.mutate({ id: rigging.id, isPermanent });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    restoreMutation.mutate({ id: rigging.id });
  };

  const isActionLoading = wantedDeletedState !== rigging.isDeleted;

  return (
    <Box
      key={rigging.id}
      sx={{
        display: 'flow-root',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: 0.5,
        pb: 0.5
      }}>
      <Box sx={{ float: 'right', ml: 0.5 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={rigging.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotProps={{
            id: rigging.id,
            type: 'riggings',
            parentId: entranceId,
            parentType: 'entrances'
          }}
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !rigging.isDeleted
            ? {
                onMoveUp,
                onMoveDown,
                isFirst,
                isLast,
                isMoveLoading: isMoving
              }
            : {})}
        />
      </Box>
      {isUpdateFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateRiggingsForm
            isNew={false}
            onSubmit={onSubmitUpdateForm}
            onCancel={handleCancel}
            onDirtyChange={setIsFormDirty}
            values={rigging}
          />
          {isDiscardDialogOpen && (
            <DiscardChangesDialog
              open={isDiscardDialogOpen}
              onKeepEditing={() => setIsDiscardDialogOpen(false)}
              onDiscard={closeForm}
            />
          )}
        </Box>
      ) : (
        <Box>
          <RiggingTable {...rigging} />
          <Contribution
            author={rigging.author}
            dateInscription={rigging.dateInscription}
            reviewer={rigging.reviewer}
            dateReviewed={rigging.dateReviewed}
            language={rigging.language}
          />
        </Box>
      )}
    </Box>
  );
};

Rigging.propTypes = {
  rigging: RiggingPropTypes,
  entranceId: PropTypes.number,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default Rigging;
