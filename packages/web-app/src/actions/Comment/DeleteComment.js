import fetch from 'isomorphic-fetch';
import { deleteCommentUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_COMMENT = 'DELETE_COMMENT';
export const DELETE_COMMENT_SUCCESS = 'DELETE_COMMENT_SUCCESS';
export const DELETE_COMMENT_PERMANENT_SUCCESS =
  'DELETE_COMMENT_PERMANENT_SUCCESS';
export const DELETE_COMMENT_FAILURE = 'DELETE_COMMENT_FAILURE';

const deleteCommentAction = () => ({
  type: DELETE_COMMENT
});

const deleteCommentSuccess = (comment, isPermanent) => ({
  type: isPermanent ? DELETE_COMMENT_PERMANENT_SUCCESS : DELETE_COMMENT_SUCCESS,
  comment
});

const deleteCommentFailure = error => ({
  type: DELETE_COMMENT_FAILURE,
  error
});

export const deleteComment =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteCommentAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteCommentUrl(id, isPermanent), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteCommentSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteCommentFailure(errorMessage));
      });
  };
