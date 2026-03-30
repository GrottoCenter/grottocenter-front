import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import { SnapshotButton } from '../Entry/Snapshots/UtilityFunction';
import { DescriptionPropTypes } from '../../../types/description.type';
import CreateDescriptionForm from '../EntitiesForm/Description/index';
import { updateDescription } from '../../../actions/Description/UpdateDescription';
import { deleteDescription } from '../../../actions/Description/DeleteDescription';
import { restoreDescription } from '../../../actions/Description/RestoreDescription';
import ActionButtons from '../Entry/ActionButtons';
import SectionTitle from '../Entry/SectionTitle';
import { usePermissions } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
`;
const Description = ({
  description,
  isEditAllowed,
  isMoving,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(description.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      updateDescription({
        id: description.id,
        title: data.title,
        body: data.body,
        language: data.language
      })
    );
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteDescription({ id: description.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreDescription({ id: description.id }));
  };

  const isActionLoading = wantedDeletedState !== description.isDeleted;

  return (
    <ListItemStyled disableGutters>
      <Box sx={{ float: 'right', ml: 1 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={description.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton
              id={description.id}
              type="descriptions"
              content={description}
            />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !description.isDeleted
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
          <CreateDescriptionForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewDescription={false}
            onSubmit={onSubmitForm}
            values={description}
          />
        </Box>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          primary={
            <SectionTitle
              title={description.title}
              anchorId={`description-${description.id}`}
              isDeleted={description.isDeleted}
            />
          }
          secondary={
            <Contribution
              body={description.body}
              author={description.author}
              reviewer={description.reviewer}
              dateInscription={description.dateInscription}
              dateReviewed={description.dateReviewed}
              isDeleted={description.isDeleted}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Description.propTypes = {
  description: DescriptionPropTypes,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default Description;
