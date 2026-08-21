import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DescriptionPropTypes } from '../../../types/description.type';
import CreateDescriptionForm from '../EntitiesForm/Description/index';
import {
  useUpdateDescription,
  useDeleteDescription,
  useRestoreDescription,
  usePermissions
} from '../../../hooks';
import ActionButtons from '../Entry/ActionButtons';
import SectionTitle from '../Entry/SectionTitle';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;
const Description = ({
  description,
  isEditAllowed,
  isMoving,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  parentId,
  parentType
}) => {
  const permissions = usePermissions();
  const updateMutation = useUpdateDescription();
  const deleteMutation = useDeleteDescription();
  const restoreMutation = useRestoreDescription();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(description.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    updateMutation.mutate({
      id: description.id,
      title: data.title,
      body: data.body,
      language: data.language
    });
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    deleteMutation.mutate({ id: description.id, isPermanent });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    restoreMutation.mutate({ id: description.id });
  };

  const isActionLoading = wantedDeletedState !== description.isDeleted;

  return (
    <ListItemStyled disableGutters>
      <Box sx={{ float: 'right', ml: 0.5 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={description.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotProps={{
            id: description.id,
            type: 'descriptions',
            parentId,
            parentType: `${parentType}s`
          }}
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !description.isDeleted
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
          <CreateDescriptionForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewDescription={false}
            onSubmit={onSubmitForm}
            values={description}
          />
        </Box>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          primary={
            <SectionTitle
              title={description.title}
              anchorId={`description-${description.id}`}
              isDeleted={description.isDeleted}
            />
          }
          secondary={
            <Contribution
              body={description.body}
              author={description.author}
              reviewer={description.reviewer}
              dateInscription={description.dateInscription}
              dateReviewed={description.dateReviewed}
              language={description.language}
              isDeleted={description.isDeleted}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Description.propTypes = {
  description: DescriptionPropTypes,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  parentId: PropTypes.number,
  parentType: PropTypes.string
};

export default Description;
