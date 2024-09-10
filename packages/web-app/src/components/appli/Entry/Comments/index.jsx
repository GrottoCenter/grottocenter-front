import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { CommentPropTypes } from '../../../../types/entrance.type';
import Comment from './Comment';
import CreateCommentForm from '../../Form/CommentForm';
import { postComment } from '../../../../actions/Comment/CreateComment';
import { usePermissions } from '../../../../hooks';
import Alert from '../../../common/Alert';

const Comments = ({ entranceId, comments, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postComment({
        entrance: entranceId,
        title: data.title,
        body: data.body,
        aestheticism: data.aestheticism,
        caving: data.caving,
        access: data.access,
        eTTrail: data.eTTrail,
        eTUnderground: data.eTUnderground,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Comment' })}
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
            <List dense disablePadding>
              {comments.map(comment => (
                <Comment
                  comment={comment}
                  key={comment.id}
                  isEditAllowed={isEditAllowed}
                />
              ))}
            </List>
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
