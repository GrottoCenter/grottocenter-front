import React, { useState, useEffect } from 'react';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { updateLocation } from '../../../../actions/Location/UpdateLocation';
import { deleteLocation } from '../../../../actions/Location/DeleteLocation';
import { restoreLocation } from '../../../../actions/Location/RestoreLocation';
import ActionButtons from '../ActionButtons';
import SectionTitle from '../SectionTitle';
import { LocationPropTypes } from '../../../../types/entrance.type';
import CreateLocationForm from '../../Form/LocationForm/index';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;
const Location = ({ location, isEditAllowed }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(location.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      updateLocation({
        id: data.id,
        title: data.title,
        body: data.body,
        language: data.language.id
      })
    );
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteLocation({ id: location.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreLocation({ id: location.id }));
  };

  const isActionLoading = wantedDeletedState !== location.isDeleted;

  return (
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={location.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton
              id={location.id}
              type="locations"
              content={location}
            />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
        />
      </Box>
      {isUpdateFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateLocationForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewLocation={false}
            onSubmit={onSubmitForm}
            values={location}
          />
        </Box>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          primary={
            <SectionTitle
              title={location.title}
              isDeleted={location.isDeleted}
            />
          }
          secondary={
            <Contribution
              author={location.author}
              reviewer={location.reviewer}
              body={location.body}
              creationDate={location.creationDate}
              dateReviewed={location.reviewedDate}
              isDeleted={location.isDeleted}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Location.propTypes = {
  location: LocationPropTypes,
  isEditAllowed: PropTypes.bool
};

export default Location;
