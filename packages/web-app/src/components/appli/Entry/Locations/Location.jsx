import { useState, useEffect } from 'react';
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
import CreateLocationForm from '../../EntitiesForm/Location';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;
const Location = ({
  location,
  entranceId,
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
    setWantedDeletedState(location.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      updateLocation({
        id: data.id,
        title: data.title,
        body: data.body,
        language: data.language
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
    <ListItemStyled disableGutters>
      <Box sx={{ float: 'right', ml: 0.5 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={location.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotProps={{
            id: location.id,
            type: 'locations',
            parentId: entranceId,
            parentType: 'entrances'
          }}
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !location.isDeleted
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
              anchorId={`location-${location.id}`}
              isDeleted={location.isDeleted}
            />
          }
          secondary={
            <Contribution
              author={location.author}
              reviewer={location.reviewer}
              body={location.body}
              dateInscription={location.dateInscription}
              dateReviewed={location.dateReviewed}
              language={location.language}
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
  entranceId: PropTypes.number,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default Location;
