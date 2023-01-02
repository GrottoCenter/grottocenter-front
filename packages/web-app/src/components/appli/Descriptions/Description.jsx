import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { useDispatch } from 'react-redux';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';

import { descriptionType } from './propTypes';
import CreateDescriptionForm from '../Form/DescriptionForm/index';
import { updateDescription } from '../../../actions/Description/UpdateDescription';
import { usePermissions } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const Description = ({ description }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { author, reviewer, body, creationDate, reviewedDate, title } =
    description;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateDescription({
        id: description.id,
        title: data.title,
        body: data.body,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ListItem disableGutters divider alignItems="flex-start">
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
          disableTypography
          primary={<Typography variant="h4">{title}</Typography>}
          secondary={
            <Contribution
              body={body}
              author={author}
              reviewer={reviewer}
              creationDate={creationDate}
              dateReviewed={reviewedDate}
            />
          }
        />
      )}
      {permissions.isAuth && (
        <ListItemIcon style={{ alignSelf: 'start' }}>
          <IconButton
            onClick={() => setIsFormVisible(!isFormVisible)}
            color="primary"
            aria-label="edit"
            size="large">
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
