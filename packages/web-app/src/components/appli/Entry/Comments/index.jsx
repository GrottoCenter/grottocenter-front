import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';

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
      postComment({ ...data, entrance: entranceId, language: data.language.id })
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
            {isFormVisible ? <RemoveCircleIcon /> : <AddCircleIcon />}
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
            <List>
              {comments.map(comment => (
                <React.Fragment key={comment.id}>
                  <Comment comment={comment} />
                  {comments.length > 1 && (
                    <Divider variant="middle" component="li" />
                  )}
                </React.Fragment>
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
