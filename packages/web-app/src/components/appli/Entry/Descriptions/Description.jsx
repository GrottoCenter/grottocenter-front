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

import { descriptionType } from '../Provider';
import { makeFormattedText, authorLink } from '../utils';
import CreateDescriptionForm from '../../Form/DescriptionForm/index';
import { updateDescription } from '../../../../actions/UpdateDescription';
import { usePermissions } from '../../../../hooks';

const Description = ({ description }) => {
  const { formatDate } = useIntl();
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
                {authorLink(author)}
                {`${
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

Description.propTypes = {
  description: descriptionType
};

export default Description;
