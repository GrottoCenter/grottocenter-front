import { ListItem, Box, ListItemText, ListItemIcon } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { usePermissions, useUserProperties } from '../../../../hooks';
import { updateComment } from '../../../../actions/Comment/UpdateComment';
import { deleteComment } from '../../../../actions/Comment/DeleteComment';
import { restoreComment } from '../../../../actions/Comment/RestoreComment';
import ActionButtons from '../ActionButtons';
import SectionTitle from '../SectionTitle';
import CreateCommentForm from '../../Form/CommentForm/index';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Ratings from '../Ratings';
import Contribution from '../../../common/Contribution/Contribution';
import Duration from '../../../common/Properties/Duration';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)};
`;

const StyledListItemIcon = styled(ListItemIcon)`
  width: 100%;
  flex-direction: column;
`;
const StyledRatings = styled(Ratings)`
  gap: 20px;
  padding-bottom: 10px;
`;
const DurationContainer = styled('div')`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20px;
`;

const Comment = ({ comment, isEditAllowed }) => {
  const dispatch = useDispatch();
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
        language: data.language.id
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
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
        <ActionButtons
          isLoading={isActionLoading}
          isUpdating={isUpdateFormVisible}
          setIsUpdating={setIsUpdateFormVisible}
          isDeleted={comment.isDeleted}
          canEdit={isEditAllowed && permissions.isAuth && canEdit}
          canDelete={isEditAllowed && permissions.isModerator}
          snapshotEl={
            <SnapshotButton id={comment.id} type="comments" content={comment} />
          }
          onDeletePress={onDeletePress}
          onRestorePress={onRestorePress}
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
              />
            }
          />
          <StyledListItemIcon>
            <StyledRatings
              interest={comment.aestheticism}
              progression={comment.caving}
              access={comment.approach}
              size="small"
            />
            <DurationContainer>
              {!!comment.eTTrail && comment.eTTrail.length > 0 && (
                <Duration
                  image="/images/time-to-go.svg"
                  durationStr={comment.eTTrail}
                  title="Time to go"
                />
              )}
              {!!comment.eTUnderground && comment.eTUnderground.length > 0 && (
                <Duration
                  image="/images/underground_time.svg"
                  durationStr={comment.eTUnderground}
                  title="Underground time"
                />
              )}
            </DurationContainer>
          </StyledListItemIcon>
        </>
      )}
    </ListItemStyled>
  );
};

Comment.propTypes = {
  comment: CommentPropTypes,
  isEditAllowed: PropTypes.bool
};

export default Comment;
