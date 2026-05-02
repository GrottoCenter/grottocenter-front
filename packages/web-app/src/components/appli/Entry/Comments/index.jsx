import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Box, Button, Divider, Paper, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Comment from './Comment';
import CreateCommentForm from '../../EntitiesForm/Comment';
import { postComment } from '../../../../actions/Comment/CreateComment';
import { moveCommentRelevance } from '../../../../actions/Comment/MoveRelevance';
import { usePermissions } from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Comments = ({ entranceId, comments, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { movingId, handleMove } =
    useMoveRelevanceWithUndo(moveCommentRelevance);

  const onSubmitForm = data => {
    dispatch(
      postComment({
        entrance: entranceId,
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
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      collapsible={false}
      dense
      anchorId="comments"
      title={formatMessage({ id: 'Comments' })}
      icon={
        permissions.isAuth &&
        isEditAllowed && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new comment' })
                : formatMessage({ id: 'Add a new comment' })
            }>
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
              size="small"
              variant="outlined"
              onClick={() => setIsFormVisible(!isFormVisible)}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}>
              {formatMessage({ id: isFormVisible ? 'Cancel' : 'New' })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateCommentForm isNewComment onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {comments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(() => {
                const sorted = sortByRelevance(comments);
                const activeIds = sorted
                  .filter(c => !c.isDeleted)
                  .map(c => c.id);
                return sorted.map(comment => (
                  <Paper
                    key={comment.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Comment
                      comment={comment}
                      isEditAllowed={isEditAllowed}
                      isMoving={movingId === comment.id}
                      onMoveUp={() => handleMove(comment.id, -1)}
                      onMoveDown={() => handleMove(comment.id, 1)}
                      isFirst={comment.id === activeIds[0]}
                      isLast={comment.id === activeIds[activeIds.length - 1]}
                    />
                  </Paper>
                ));
              })()}
            </Box>
          ) : (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no comment for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Comments.propTypes = {
  entranceId: PropTypes.number.isRequired,
  comments: PropTypes.arrayOf(CommentPropTypes),
  isEditAllowed: PropTypes.bool
};

export default Comments;
