import { ListItem, Box, ListItemText, Typography } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { timeToGoIcon, undergroundTimeIcon } from '../../../../assets/icons';
import { usePermissions, useUserProperties } from '../../../../hooks';
import { updateComment } from '../../../../actions/Comment/UpdateComment';
import { deleteComment } from '../../../../actions/Comment/DeleteComment';
import { restoreComment } from '../../../../actions/Comment/RestoreComment';
import ActionButtons from '../ActionButtons';
import SectionTitle from '../SectionTitle';
import CreateCommentForm from '../../EntitiesForm/Comment';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Ratings from '../Ratings';
import Contribution from '../../../common/Contribution/Contribution';
import AuthorAndDate from '../../../common/Contribution/AuthorAndDate';
import Duration from '../../../common/Properties/Duration';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  display: flow-root;
  padding: 0;
`;

const StyledListItemText = styled(ListItemText)`
  width: 100%;
`;

const StyledRatings = styled(Ratings)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

const Comment = ({ comment, entranceId, isEditAllowed, isMoving, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isUpdateFormVisible, setIsUpdateFormVisible] = useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    setWantedDeletedState(comment.isDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitForm = data => {
    dispatch(
      updateComment({
        id: data.id,
        title: data.title,
        body: data.body,
        aestheticism: data.aestheticism,
        caving: data.caving,
        approach: data.approach,
        eTTrail: data.eTTrail,
        eTUnderground: data.eTUnderground,
        language: data.language
      })
    );
    setIsUpdateFormVisible(false);
  };

  const onDeletePress = isPermanent => {
    setWantedDeletedState(true);
    dispatch(deleteComment({ id: comment.id, isPermanent }));
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreComment({ id: comment.id }));
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
      <Box sx={{ float: 'right', ml: 1 }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={comment.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth && canEdit}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton id={comment.id} type="comments" parentId={entranceId} parentType="entrances" />
          }
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
          {(comment.aestheticism || comment.caving || comment.approach ||
            comment.eTTrail?.length > 0 ||
            comment.eTUnderground?.length > 0) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, pt: 1 }}>
              {(comment.eTTrail?.length > 0 || comment.eTUnderground?.length > 0) && (
                <Box sx={{ display: 'flex', gap: 2 }}>
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
          {(comment.author || comment.reviewer || comment.language) && (
            <Typography variant="caption" color="text.secondary" component="div">
              {comment.author && (
                <AuthorAndDate author={comment.author} date={comment.dateInscription} textColor="inherit" />
              )}
              {comment.author && comment.reviewer && ' · '}
              {comment.reviewer && (
                <AuthorAndDate
                  author={comment.reviewer}
                  date={comment.dateReviewed}
                  verb={comment.author ? 'Updated' : ''}
                  textColor="inherit"
                />
              )}
              {(comment.author || comment.reviewer) && comment.language && ' · '}
              {comment.language &&
                `${formatMessage({ id: 'Language' })} : ${comment.language.toUpperCase()}`}
            </Typography>
          )}
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
