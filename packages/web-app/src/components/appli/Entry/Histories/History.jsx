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
import AuthorLink from '../../../common/AuthorLink/index';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/UpdateHistory';
import { usePermissions } from '../../../../hooks';
import MultilinesTypography from '../../../common/MultilinesTypography';

const History = ({ history }) => {
  const { formatDate } = useIntl();
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
            <>
              <MultilinesTypography>{body}</MultilinesTypography>
              <br />
              <Typography
                component="span"
                variant="caption"
                color="textPrimary">
                <AuthorLink author={author} />
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

History.propTypes = {
  history: historyType
};

export default History;
