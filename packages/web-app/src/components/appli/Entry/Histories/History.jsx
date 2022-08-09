import React, { useState } from 'react';
import {} from 'react-intl';
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

import { historyType } from '../Provider';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/History/UpdateHistory';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const History = ({ history }) => {
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
        <ListItemText
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

History.propTypes = {
  history: historyType
};

export default History;
