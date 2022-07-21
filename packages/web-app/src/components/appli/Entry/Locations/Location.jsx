import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
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
import makeFormattedText from '../utils';
import CreateLocationForm from '../../Form/LocationForm/index';
import { updateLocation } from '../../../../actions/UpdateLocation';
import { usePermissions } from '../../../../hooks';

const Location = ({ location }) => {
  const { formatMessage, formatDate } = useIntl();
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
          // whiteSpace property for description multi-lines display
          style={{ whiteSpace: 'pre-line' }}
          primary={title}
          secondary={
            <>
              {makeFormattedText(body)}
              <br />
              <Typography
                component="span"
                variant="caption"
                color="textPrimary">
                {`${!isNil(author.nickname) &&
                  formatMessage({ id: 'Posted by' })} ${author.nickname} ${
                  !isNil(creationDate)
                    ? `- ${formatDate(creationDate, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })}`
                    : ''
                }`}
              </Typography>
            </>
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
