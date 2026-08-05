import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Divider, Tooltip, Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import React, { useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { usePermissions } from '../../../../hooks';
import { postRiggings } from '../../../../actions/Riggings/CreateRigging';
import { moveRiggingRelevance } from '../../../../actions/Riggings/MoveRelevance';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import CreateRiggingsForm from '../../EntitiesForm/Riggings';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Rigging from './Rigging';
import { RiggingPropTypes } from '../../../../types/entrance.type';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';
import DiscardChangesDialog from '../../../common/DiscardChangesDialog';

const Riggings = ({ riggings, entranceId, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const { movingId, handleMove } =
    useMoveRelevanceWithUndo(moveRiggingRelevance);

  const closeForm = () => {
    setIsFormVisible(false);
    setIsFormDirty(false);
    setIsDiscardDialogOpen(false);
  };
  const handleToggleForm = () => {
    if (isFormVisible && isFormDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    if (isFormVisible) closeForm();
    else setIsFormVisible(true);
  };
  const handleSubmitForm = data => {
    dispatch(
      postRiggings({
        entrance: entranceId,
        title: data.title,
        obstacles: data.obstacles,
        language: data.language
      })
    );
    closeForm();
  };

  return (
    <ScrollableContent
      dense
      anchorId="rigging"
      defaultExpanded={riggings.length > 0}
      title={formatMessage({ id: 'Riggings' })}
      icon={
        permissions.isAuth &&
        isEditAllowed && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new rigging' })
                : formatMessage({ id: 'Add a new rigging' })
            }>
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
              size="small"
              variant="outlined"
              onClick={handleToggleForm}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}>
              {formatMessage({ id: isFormVisible ? 'Cancel' : 'New' })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateRiggingsForm
                isNew
                onSubmit={handleSubmitForm}
                onDirtyChange={setIsFormDirty}
              />
              <Divider />
            </>
          )}
          {isDiscardDialogOpen && (
            <DiscardChangesDialog
              open={isDiscardDialogOpen}
              onKeepEditing={() => setIsDiscardDialogOpen(false)}
              onDiscard={closeForm}
            />
          )}
          {riggings.length > 0 &&
            (() => {
              const sorted = sortByRelevance(riggings);
              const activeIds = sorted.filter(r => !r.isDeleted).map(r => r.id);
              return sorted.map(rigging => (
                <React.Fragment key={rigging.id}>
                  <Rigging
                    rigging={rigging}
                    entranceId={entranceId}
                    isEditAllowed={isEditAllowed}
                    isMoving={movingId === rigging.id}
                    onMoveUp={() => handleMove(rigging.id, -1)}
                    onMoveDown={() => handleMove(rigging.id, 1)}
                    isFirst={rigging.id === activeIds[0]}
                    isLast={rigging.id === activeIds[activeIds.length - 1]}
                  />
                </React.Fragment>
              ));
            })()}
          {riggings.length === 0 && (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no rigging for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Riggings.propTypes = {
  riggings: PropTypes.arrayOf(RiggingPropTypes),
  entranceId: PropTypes.number.isRequired,
  isEditAllowed: PropTypes.bool
};

export default Riggings;
