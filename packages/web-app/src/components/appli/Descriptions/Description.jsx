import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import { SnapshotButton } from '../Entry/Snapshots/UtilityFunction';
import { DescriptionPropTypes } from '../../../types/description.type';
import CreateDescriptionForm from '../Form/DescriptionForm/index';
import { updateDescription } from '../../../actions/Description/UpdateDescription';
import { deleteDescription } from '../../../actions/Description/DeleteDescription';
import { restoreDescription } from '../../../actions/Description/RestoreDescription';
import ActionButtons from '../Entry/ActionButtons';
import SectionTitle from '../Entry/SectionTitle';
import { usePermissions } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;
const Description = ({ description, isEditAllowed }) => {
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
        language: data.language.id
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
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
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
              isDeleted={description.isDeleted}
            />
          }
          secondary={
            <Contribution
              body={description.body}
              author={description.author}
              reviewer={description.reviewer}
              creationDate={description.creationDate}
              dateReviewed={description.reviewedDate}
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
  isEditAllowed: PropTypes.bool
};

export default Description;
