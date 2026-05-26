import fetch from 'isomorphic-fetch';
import { postCommentUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { minutesToDurationString } from '../../utils/dateTimeDuration';

export const POST_COMMENT = 'POST_COMMENT';
export const POST_COMMENT_SUCCESS = 'POST_COMMENT_SUCCESS';
export const POST_COMMENT_FAILURE = 'POST_COMMENT_FAILURE';

const postCommentAction = () => ({
  type: POST_COMMENT
});

const postCommentSuccess = comment => ({
  type: POST_COMMENT_SUCCESS,
  comment
});

const postCommentFailure = error => ({
  type: POST_COMMENT_FAILURE,
  error
});

export const postComment =
  ({
    entrance,
    title,
    body,
    aestheticism,
    caving,
    approach,
    eTTrail,
    eTUnderground,
    language
  }) =>
  (dispatch, getState) => {
    dispatch(postCommentAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        entrance,
        title,
        body,
        aestheticism,
        caving,
        approach,
        eTTrail: minutesToDurationString(eTTrail) ?? null,
        eTUnderground: minutesToDurationString(eTUnderground) ?? null,
        language
      }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCommentUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(postCommentSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          postCommentFailure(
            makeErrorMessage(error.message, `Creating a new comment`),
            error.message
          )
        );
      });
  };
