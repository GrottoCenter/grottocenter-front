import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItem,
  ListItemText
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Cancel';

import { locationType } from '../Provider';
import CreateLocationForm from '../../Form/LocationForm/index';
import { updateLocation } from '../../../../actions/Location/UpdateLocation';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const Location = ({ location }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { author, body, creationDate, title } = location;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateLocation({
        ...data,
        entrance: location.entrance,
        language: data.language.id,
        location: location.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ListItem>
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
          primary={title}
          secondary={
            <Contribution
              author={author}
              body={body}
              creationDate={creationDate}
            />
          }
        />
      )}
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
    </ListItem>
  );
};

Location.propTypes = {
  location: locationType
};

export default Location;
