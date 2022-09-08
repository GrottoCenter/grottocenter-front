import fetch from 'isomorphic-fetch';
import { postCommentUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { minutesToDurationString } from '../../util/dateTimeDuration';

export const POST_COMMENT = 'POST_COMMENT';
export const POST_COMMENT_SUCCESS = 'POST_COMMENT_SUCCESS';
export const POST_COMMENT_FAILURE = 'POST_COMMENT_FAILURE';

export const postCommentAction = () => ({
  type: POST_COMMENT
});

export const postCommentSuccess = comments => ({
  type: POST_COMMENT_SUCCESS,
  comments
});

export const postCommentFailure = error => ({
  type: POST_COMMENT_FAILURE,
  error
});

function transformData(data) {
  return {
    language: data.language,
    title: data.title,
    body: data.body,
    aestheticism: data.interestRate !== null ? data.interestRate * 2 : null,
    caving: data.progressionRate !== null ? data.progressionRate * 2 : null,
    approach: data.accessRate !== null ? data.accessRate * 2 : null,
    entrance: data.entrance,
    eTTrail:
      data.eTTrail !== null ? minutesToDurationString(data.eTTrail) : null,
    eTUnderground:
      data.eTUnderground !== null
        ? minutesToDurationString(data.eTUnderground)
        : null
  };
}

export const postComment = data => (dispatch, getState) => {
  dispatch(postCommentAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(transformData(data)),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCommentUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(json => dispatch(postCommentSuccess(json)))
    .catch(error =>
      dispatch(
        postCommentFailure(
          makeErrorMessage(error.message, `Creating a new comment`),
          error.message
        )
      )
    );
};
