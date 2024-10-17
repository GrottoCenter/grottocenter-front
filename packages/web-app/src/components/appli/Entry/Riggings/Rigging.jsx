import { Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { usePermissions } from '../../../../hooks';
import { updateRiggings } from '../../../../actions/Riggings/UpdateRigging';
import { deleteRiggings } from '../../../../actions/Riggings/DeleteRigging';
import { restoreRiggings } from '../../../../actions/Riggings/RestoreRigging';
import ActionButtons from '../ActionButtons';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import { RiggingPropTypes } from '../../../../types/entrance.type';
import Contribution from '../../../common/Contribution/Contribution';
import RiggingTable from './RiggingTable';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const Rigging = ({ rigging, isEditAllowed }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(rigging.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitUpdateForm = data => {
    dispatch(
      updateRiggings({
        ...data,
        language: data.language.id
      })
    );
    setIsUpdateFormVisible(false);
  };
  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteRiggings({ id: rigging.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreRiggings({ id: rigging.id }));
  };

  const isActionLoading = wantedDeletedState !== rigging.isDeleted;

  return (
    <Box key={rigging.id} position="relative" mt={2}>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={rigging.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton id={rigging.id} type="riggings" content={rigging} />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
        />
      </Box>
      {isUpdateFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateRiggingsForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNew={false}
            onSubmit={onSubmitUpdateForm}
            values={rigging}
          />
        </Box>
      ) : (
        <Box>
          <RiggingTable {...rigging} />
          <Contribution
            author={rigging.author}
            dateInscription={rigging.dateInscription}
            reviewer={rigging.reviewer}
            dateReviewed={rigging.dateReviewed}
          />
        </Box>
      )}
    </Box>
  );
};

Rigging.propTypes = {
  rigging: RiggingPropTypes,
  isEditAllowed: PropTypes.bool
};

export default Rigging;
