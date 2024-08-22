import fetch from 'isomorphic-fetch';
import { putCommentUrl } from '../../conf/apiRoutes';
import { minutesToDurationString } from '../../util/dateTimeDuration';
import { checkAndGetStatus } from '../utils';

export const UPDATE_COMMENT = 'UPDATE_COMMENT';
export const UPDATE_COMMENT_SUCCESS = 'UPDATE_COMMENT_SUCCESS';
export const UPDATE_COMMENT_FAILURE = 'UPDATE_COMMENT_FAILURE';

const updateCommentAction = () => ({
  type: UPDATE_COMMENT
});

const updateCommentSuccess = comment => ({
  type: UPDATE_COMMENT_SUCCESS,
  comment
});

const updateCommentFailure = error => ({
  type: UPDATE_COMMENT_FAILURE,
  error
});

export const updateComment =
  ({
    id,
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
    dispatch(updateCommentAction());

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify({
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

    return fetch(putCommentUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(updateCommentSuccess(data)))
      .catch(errorMessage => {
        dispatch(updateCommentFailure(errorMessage));
      });
  };
