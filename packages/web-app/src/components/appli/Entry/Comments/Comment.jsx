import { ListItem, Box, ListItemText } from '@mui/material';
import { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { timeToGoIcon, undergroundTimeIcon } from '../../../../assets/icons';
import {
  useUpdateComment,
  useDeleteComment,
  useRestoreComment,
  usePermissions,
  useUserProperties
} from '../../../../hooks';
import ActionButtons from '../ActionButtons';
import SectionTitle from '../SectionTitle';
import CreateCommentForm from '../../EntitiesForm/Comment';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Ratings from '../Ratings';
import Contribution from '../../../common/Contribution/Contribution';
import ContributionMetadata from '../../../common/Contribution/ContributionMetadata';
import Duration from '../../../common/Properties/Duration';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  padding: 0;
`;

const StyledListItemText = styled(ListItemText)`
  width: 100%;
`;

const StyledRatings = styled(Ratings)`
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Comment = ({
  comment,
  entranceId,
  isEditAllowed,
  isMoving,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const updateMutation = useUpdateComment();
  const deleteMutation = useDeleteComment();
  const restoreMutation = useRestoreComment();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(comment.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    updateMutation.mutate({
      id: data.id,
      title: data.title,
      body: data.body,
      aestheticism: data.aestheticism,
      caving: data.caving,
      approach: data.approach,
      eTTrail: data.eTTrail,
      eTUnderground: data.eTUnderground,
      language: data.language
    });
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    deleteMutation.mutate({ id: comment.id, isPermanent });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    restoreMutation.mutate({ id: comment.id });
  };

  const isActionLoading = wantedDeletedState !== comment.isDeleted;

  const userId = useUserProperties()?.id ?? null;
  const canEdit =
    (comment.author?.id &&
      userId?.toString() === comment.author?.id.toString()) ||
    permissions.isAdmin ||
    permissions.isModerator;

  return (
    <ListItemStyled disableGutters>
      <Box sx={{ float: 'right', ml: 0.5 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={comment.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth && canEdit}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotProps={{
            id: comment.id,
            type: 'comments',
            parentId: entranceId,
            parentType: 'entrances'
          }}
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
          {...(isEditAllowed && permissions.isAuth && !comment.isDeleted
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
          <CreateCommentForm
            closeForm={() => setIsUpdateFormVisible(false)}
            isNewComment={false}
            onSubmit={onSubmitForm}
            values={comment}
          />
        </Box>
      ) : (
        <>
          <StyledListItemText
            style={{ margin: 0 }}
            disableTypography
            primary={
              <SectionTitle
                title={comment.title}
                anchorId={`comment-${comment.id}`}
                isDeleted={comment.isDeleted}
              />
            }
            secondary={
              <Contribution
                author={comment.author}
                body={comment.body}
                dateInscription={comment.dateInscription}
                reviewer={comment.reviewer}
                dateReviewed={comment.dateReviewed}
                isDeleted={comment.isDeleted}
                hideAttribution
              />
            }
          />
          {(comment.aestheticism ||
            comment.caving ||
            comment.approach ||
            comment.eTTrail?.length > 0 ||
            comment.eTUnderground?.length > 0) && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.5,
                pt: 0.5
              }}>
              {(comment.eTTrail?.length > 0 ||
                comment.eTUnderground?.length > 0) && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {comment.eTTrail?.length > 0 && (
                    <Duration
                      image={timeToGoIcon}
                      durationStr={comment.eTTrail}
                      title={formatMessage({ id: 'Time to go' })}
                    />
                  )}
                  {comment.eTUnderground?.length > 0 && (
                    <Duration
                      image={undergroundTimeIcon}
                      durationStr={comment.eTUnderground}
                      title={formatMessage({ id: 'Underground time' })}
                    />
                  )}
                </Box>
              )}
              {(comment.aestheticism || comment.caving || comment.approach) && (
                <StyledRatings
                  interest={comment.aestheticism}
                  progression={comment.caving}
                  access={comment.approach}
                  size="small"
                />
              )}
            </Box>
          )}
          <ContributionMetadata
            createdBy={comment.author}
            createdAt={comment.dateInscription}
            updatedBy={comment.reviewer}
            updatedAt={comment.dateReviewed}
            language={comment.language}
            creationVerb="Posted"
          />
        </>
      )}
    </ListItemStyled>
  );
};

Comment.propTypes = {
  comment: CommentPropTypes,
  entranceId: PropTypes.number,
  isEditAllowed: PropTypes.bool,
  isMoving: PropTypes.bool,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool
};

export default Comment;
