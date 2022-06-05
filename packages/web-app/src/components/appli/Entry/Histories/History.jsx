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

import { historyType } from '../Provider';
import { makeFormattedText } from '../utils';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/UpdateHistory';
import { usePermissions } from '../../../../hooks';

const History = ({ history }) => {
  const { formatMessage, formatDate } = useIntl();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { author, body, creationDate } = history;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateHistory({
        ...data,
        entrance: history.entrance,
        language: data.language.id,
        history: history.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ListItem>
      {isFormVisible ? (
        <Box width="100%">
          <CreateHistoryForm
            closeForm={() => setIsFormVisible(false)}
            isNewHistory={false}
            onSubmit={onSubmitForm}
            values={history}
          />
        </Box>
      ) : (
        <>
          <ListItemText
            // whiteSpace property for description multi-lines display
            style={{ whiteSpace: 'pre-line' }}
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
        </>
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

History.propTypes = {
  history: historyType
};

export default History;
