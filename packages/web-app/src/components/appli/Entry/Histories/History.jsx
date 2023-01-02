import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItem,
  ListItemText
} from '@mui/material';
import { useDispatch } from 'react-redux';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';

import { historyType } from '../Provider';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/History/UpdateHistory';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const History = ({ history }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { body, author, reviewer, creationDate, reviewedDate } = history;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateHistory({
        id: data.id,
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
          <CreateHistoryForm
            closeForm={() => setIsFormVisible(false)}
            isNewHistory={false}
            onSubmit={onSubmitForm}
            values={history}
          />
        </Box>
      ) : (
        <ListItemText
          disableTypography
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

History.propTypes = {
  history: historyType
};

export default History;
