import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItem,
  ListItemText,
  Typography
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';

import { locationType } from '../Provider';
import CreateLocationForm from '../../Form/LocationForm/index';
import { updateLocation } from '../../../../actions/Location/UpdateLocation';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const Location = ({ location }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { id, title, body, author, reviewer, creationDate, reviewedDate } =
    location;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateLocation({
        id: data.id,
        title: data.title,
        body: data.body,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ListItem disableGutters divider alignItems="flex-start">
      {isFormVisible ? (
        <Box width="100%">
          <CreateLocationForm
            closeForm={() => setIsFormVisible(false)}
            isNewLocation={false}
            onSubmit={onSubmitForm}
            values={location}
          />
        </Box>
      ) : (
        <ListItemText
          disableTypography
          primary={<Typography variant="h4">{title}</Typography>}
          secondary={
            <Contribution
              author={author}
              reviewer={reviewer}
              body={body}
              creationDate={creationDate}
              dateReviewed={reviewedDate}
            />
          }
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <ListItemIcon style={{ alignSelf: 'start' }}>
          <SnapshotButton id={id} type="locations" content={location} />
        </ListItemIcon>
        {permissions.isAuth && (
          <ListItemIcon style={{ alignSelf: 'start' }}>
            <IconButton
              onClick={() => setIsFormVisible(!isFormVisible)}
              color="primary"
              aria-label="edit">
              {isFormVisible ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </ListItemIcon>
        )}
      </Box>
    </ListItem>
  );
};

Location.propTypes = {
  location: locationType
};

export default Location;
