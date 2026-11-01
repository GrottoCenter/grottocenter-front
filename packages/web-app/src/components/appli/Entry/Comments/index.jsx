import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Box, Divider, Paper } from '@mui/material';

import SectionCreateButton from '@/components/common/SectionCreateButton';
import { createRetryAction } from '@/components/common/snackbarActions';
import { useNotification } from '@/hooks/useNotification';
import { usePerson } from '@/hooks/queries/usePerson';
import { useLinkExploredEntrance } from '@/hooks/mutations/useExploredEntrance';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Comment from './Comment';
import CreateCommentForm from '../../EntitiesForm/Comment';
import {
  useCreateComment,
  useMoveCommentRelevance,
  usePermissions,
  useUserProperties
} from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Comments = ({ entranceId, comments, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const { onSuccess, onWarning, onClose } = useNotification();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const createMutation = useCreateComment({ isInline: true });
  const userId = useUserProperties()?.id;
  const personQuery = usePerson(userId);
  const linkExploredMutation = useLinkExploredEntrance({ isInline: true });
  const isExplored = personQuery.data?.exploredEntrances?.some(
    entrance => String(entrance.id) === String(entranceId)
  );
  const explorationSnackbarKey = `comment-exploration-${userId}-${entranceId}`;
  useEffect(() => {
    if (isExplored) onClose(explorationSnackbarKey);
  }, [isExplored, explorationSnackbarKey, onClose]);
  let explorationStatus = null;
  if (userId && personQuery.isSuccess)
    explorationStatus = isExplored ? 'explored' : 'unexplored';
  const moveMutation = useMoveCommentRelevance();
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveMutation);

  const handleMarkExplored = () =>
    linkExploredMutation.mutateAsync({ entranceId, caverId: userId });

  const onSubmitForm = async data => {
    await createMutation.mutateAsync({
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
    if (data.shouldMarkExplored && explorationStatus === 'unexplored') {
      try {
        await handleMarkExplored();
        onClose(explorationSnackbarKey);
      } catch (error) {
        onWarning(
          <>
            <FormattedMessage id="Comment published, but the entrance could not be added to your explored entrances." />
            {error?.status === 429 && (
              <>
                {' '}
                <FormattedMessage id="Too many requests" />
              </>
            )}
          </>,
          {
            key: explorationSnackbarKey,
            persist: true,
            preventDuplicate: true,
            action: createRetryAction({
              onRetry: handleMarkExplored,
              onClose,
              labelId: 'Retry adding'
            })
          }
        );
        return;
      }
    }
    onSuccess(<FormattedMessage id="Comment published." />);
  };

  const handleToggleForm = () => {
    if (createMutation.isPending || linkExploredMutation.isPending) return;
    createMutation.reset();
    linkExploredMutation.reset();
    setIsFormVisible(!isFormVisible);
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
            testId="create-comment"
            isOpen={isFormVisible}
            onToggle={handleToggleForm}
            disabled={
              createMutation.isPending || linkExploredMutation.isPending
            }
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
              <CreateCommentForm
                isNewComment
                onSubmit={onSubmitForm}
                closeForm={handleToggleForm}
                error={createMutation.error}
                explorationStatus={explorationStatus}
              />
              <Divider sx={{ my: 2 }} />
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
