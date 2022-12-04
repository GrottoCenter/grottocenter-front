import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CancelIcon from '@material-ui/icons/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { commentsType } from '../Provider';
import Comment from './Comment';
import CreateCommentForm from '../../Form/CommentForm';
import { postComment } from '../../../../actions/Comment/CreateComment';
import { usePermissions } from '../../../../hooks';
import Alert from '../../../common/Alert';

const Comments = ({ entranceId, comments }) => {
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
        aestheticism: data.interest,
        caving: data.progression,
        approach: data.access,
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
        permissions.isAuth && (
          <IconButton
            color="primary"
            onClick={() => setIsFormVisible(!isFormVisible)}>
            {isFormVisible ? <CancelIcon /> : <AddCircleIcon />}
          </IconButton>
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
                <Comment comment={comment} key={comment.id} />
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
  comments: commentsType,
  entranceId: PropTypes.number.isRequired
};

export default Comments;
