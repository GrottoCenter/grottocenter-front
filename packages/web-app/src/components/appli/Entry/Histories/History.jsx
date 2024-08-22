import React, { useState, useEffect } from 'react';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import { historyType } from '../Provider';
import CreateHistoryForm from '../../Form/HistoryForm/index';
import { updateHistory } from '../../../../actions/History/UpdateHistory';
import { deleteHistory } from '../../../../actions/History/DeleteHistory';
import { restoreHistory } from '../../../../actions/History/RestoreHistory';
import ActionButtons from '../ActionButtons';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;
const History = ({ history }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(history.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      updateHistory({
        id: data.id,
        body: data.body,
        language: data.language.id
      })
    );
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteHistory({ id: history.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreHistory({ id: history.id }));
  };

  const isActionLoading = wantedDeletedState !== history.isDeleted;

  return (
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={history.isDeleted}
          canEdit={permissions.isAuth}
          canDelete={permissions.isModerator}
          snapshotEl={
            <SnapshotButton
              id={history.id}
              type="histories"
              content={history}
            />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
        />
      </Box>
      {isUpdateFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateHistoryForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewHistory={false}
            onSubmit={onSubmitForm}
            values={history}
          />
        </Box>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          secondary={
            <Contribution
              body={history.body}
              author={history.author}
              reviewer={history.reviewer}
              creationDate={history.creationDate}
              dateReviewed={history.reviewedDate}
              isDeletedWithHeader={history.isDeleted}
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
