import React, { useState, useEffect } from 'react';
import { Box, ListItem, ListItemText } from '@mui/material';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { HistoryPropTypes } from '../../../../types/entrance.type';
import CreateHistoryForm from '../../EntitiesForm/History';
import { updateHistory } from '../../../../actions/History/UpdateHistory';
import { deleteHistory } from '../../../../actions/History/DeleteHistory';
import { restoreHistory } from '../../../../actions/History/RestoreHistory';
import ActionButtons from '../ActionButtons';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
`;
const History = ({ history, isEditAllowed, isMoving, onMoveUp, onMoveDown, isFirst, isLast }) => {
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
        language: data.language
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
    <ListItemStyled disableGutters>
      <Box sx={{ float: 'right', ml: 1 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={history.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton
              id={history.id}
              type="histories"
              content={history}
            />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !history.isDeleted
            ? {
                onMoveUp,
                onMoveDown,
                isFirst,
                isLast,
                isMoveLoading: isMoving
              }
            : {})}
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
              dateInscription={history.dateInscription}
              dateReviewed={history.dateReviewed}
              language={history.language}
              isDeletedWithHeader={history.isDeleted}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

History.propTypes = {
  history: HistoryPropTypes,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default History;
