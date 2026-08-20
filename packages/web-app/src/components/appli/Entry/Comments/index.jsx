import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Divider, Paper } from '@mui/material';

import SectionCreateButton from '@/components/common/SectionCreateButton';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Comment from './Comment';
import CreateCommentForm from '../../EntitiesForm/Comment';
import {
  useCreateComment,
  useMoveCommentRelevance,
  usePermissions
} from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Comments = ({ entranceId, comments, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const createMutation = useCreateComment();
  const moveMutation = useMoveCommentRelevance();
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveMutation);

  const onSubmitForm = data => {
    createMutation.mutate({
      entrance: entranceId,
      title: data.title,
      body: data.body,
      aestheticism: data.aestheticism,
      caving: data.caving,
      approach: data.approach,
      eTTrail: data.eTTrail,
      eTUnderground: data.eTUnderground,
      language: data.language
    });
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
          <SectionCreateButton
            isOpen={isFormVisible}
            onToggle={() => setIsFormVisible(!isFormVisible)}
            label={formatMessage({ id: 'New' })}
            tooltip={formatMessage({ id: 'Add a new comment' })}
            openTooltip={formatMessage({ id: 'Cancel adding a new comment' })}
          />
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(() => {
                const sorted = sortByRelevance(comments);
                const activeIds = sorted
                  .filter(c => !c.isDeleted)
                  .map(c => c.id);
                return sorted.map(comment => (
                  <Paper
                    key={comment.id}
                    variant="outlined"
                    sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Comment
                      comment={comment}
                      entranceId={entranceId}
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
