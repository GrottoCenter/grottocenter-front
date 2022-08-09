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

import { descriptionType } from '../Provider';
import CreateDescriptionForm from '../../Form/DescriptionForm/index';
import { updateDescription } from '../../../../actions/Description/UpdateDescription';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const Description = ({ description }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { author, body, creationDate, title } = description;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateDescription({
        ...data,
        language: data.language.id,
        description: description.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ListItem>
      {isFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateDescriptionForm
            closeForm={() => setIsFormVisible(false)}
            isNewDescription={false}
            onSubmit={onSubmitForm}
            values={description}
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

Description.propTypes = {
  description: descriptionType
};

export default Description;
