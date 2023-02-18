import React, { useState } from 'react';
import {
  Box,
  ListItemIcon,
  ListItem,
  ListItemText,
  ButtonGroup,
  Tooltip,
  Button
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';

import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { historyType } from '../Provider';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/History/UpdateHistory';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
`;
const History = ({ history }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { id, body, author, reviewer, creationDate, reviewedDate } = history;
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
  const { formatMessage } = useIntl();
  return (
    <ListItemStyled disableGutters divider alignItems="flex-start">
      <Box sx={{ alignSelf: 'flex-end' }}>
        {!isFormVisible && (
          <ListItemIcon style={{ marginTop: 0 }}>
            <ButtonGroup color="primary">
              <Tooltip
                title={formatMessage({
                  id: 'Edit this history'
                })}>
                <Button
                  disabled={!permissions.isAuth}
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  color="primary"
                  aria-label="edit">
                  <EditIcon />
                </Button>
              </Tooltip>
              <SnapshotButton id={id} type="histories" content={history} />
            </ButtonGroup>
          </ListItemIcon>
        )}
      </Box>
      {isFormVisible ? (
        <>
          <Box sx={{ alignSelf: 'flex-end' }}>
            {permissions.isAuth && (
              <ListItemIcon style={{ marginTop: 0 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  aria-label="cancel">
                  {formatMessage({ id: `Cancel` })}
                </Button>
              </ListItemIcon>
            )}
          </Box>
          <Box width="100%">
            <CreateHistoryForm
              closeForm={() => setIsFormVisible(false)}
              isNewHistory={false}
              onSubmit={onSubmitForm}
              values={history}
            />
          </Box>
        </>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
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
    </ListItemStyled>
  );
};

History.propTypes = {
  history: historyType
};

export default History;
