import fetch from 'isomorphic-fetch';
import { putCommentUrl } from '../../conf/apiRoutes';
import { minutesToDurationString } from '../../util/dateTimeDuration';

export const UPDATE_COMMENT = 'UPDATE_COMMENT';
export const UPDATE_COMMENT_SUCCESS = 'UPDATE_COMMENT_SUCCESS';
export const UPDATE_COMMENT_FAILURE = 'UPDATE_COMMENT_FAILURE';

export const updateCommentAction = () => ({
  type: UPDATE_COMMENT
});

export const updateCommentSuccess = comment => ({
  type: UPDATE_COMMENT_SUCCESS,
  comment
});

export const updateCommentFailure = error => ({
  type: UPDATE_COMMENT_FAILURE,
  error
});

function transformData(data) {
  return {
    id: data.id,
    language: data.language,
    title: data.title,
    body: data.body,
    aestheticism: data.interestRate !== null ? data.interestRate * 2 : null,
    caving: data.progressionRate !== null ? data.progressionRate * 2 : null,
    approach: data.accessRate !== null ? data.accessRate * 2 : null,
    eTTrail:
      data.eTTrail !== null ? minutesToDurationString(+data.eTTrail) : null,
    eTUnderground:
      data.eTUnderground !== null
        ? minutesToDurationString(+data.eTUnderground)
        : null
  };
}

export const updateComment = data => (dispatch, getState) => {
  dispatch(updateCommentAction());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify(transformData(data)),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCommentUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateCommentSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateCommentFailure(errorMessage));
    });
};
