import { useState } from 'react';
import { Box, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { HistoryPropTypes } from '../../../../types/entrance.type';
import CreateHistoryForm from '../../EntitiesForm/History';
import ActionButtons from '../ActionButtons';
import {
  useUpdateHistory,
  useDeleteHistory,
  useRestoreHistory,
  usePermissions
} from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const History = ({
  history,
  entranceId,
  isEditAllowed,
  isMoving,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const permissions = usePermissions();
  const updateMutation = useUpdateHistory();
  const deleteMutation = useDeleteHistory();
  const restoreMutation = useRestoreHistory();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);

  const onSubmitForm = data => {
    updateMutation.mutate({
      id: data.id,
      body: data.body,
      language: data.language
    });
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent =>
    deleteMutation.mutateAsync({ id: history.id, isPermanent });
  const onRestorePress = () => {
    restoreMutation.mutate({ id: history.id });
  };

  const isActionLoading = deleteMutation.isPending || restoreMutation.isPending;

  return (
    <ListItemStyled disableGutters>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {isUpdateFormVisible && permissions.isAuth ? (
          <CreateHistoryForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewHistory={false}
            onSubmit={onSubmitForm}
            values={history}
          />
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
      </Box>
      <Box sx={{ flexShrink: 0, ml: 0.5 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={history.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={
            isEditAllowed &&
            permissions.isAuth &&
            (permissions.isModerator || permissions.isAdmin)
          }
          canPermanentlyDelete={
            isEditAllowed && permissions.isAuth && permissions.isAdmin
          }
          deleteError={deleteMutation.error}
          restoreError={restoreMutation.error}
          onDeleteReset={deleteMutation.reset}
          snapshotProps={{
            id: history.id,
            type: 'histories',
            parentId: entranceId,
            parentType: 'entrances'
          }}
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
    </ListItemStyled>
  );
};

History.propTypes = {
  history: HistoryPropTypes,
  entranceId: PropTypes.number,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default History;
