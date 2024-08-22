import fetch from 'isomorphic-fetch';
import { restoreCommentUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_COMMENT = 'RESTORE_COMMENT';
export const RESTORE_COMMENT_SUCCESS = 'RESTORE_COMMENT_SUCCESS';
export const RESTORE_COMMENT_FAILURE = 'RESTORE_COMMENT_FAILURE';

const restoreCommentAction = () => ({
  type: RESTORE_COMMENT
});

const restoreCommentSuccess = comment => ({
  type: RESTORE_COMMENT_SUCCESS,
  comment
});

const restoreCommentFailure = error => ({
  type: RESTORE_COMMENT_FAILURE,
  error
});

export const restoreComment =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreCommentAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreCommentUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreCommentSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreCommentFailure(errorMessage));
      });
  };
