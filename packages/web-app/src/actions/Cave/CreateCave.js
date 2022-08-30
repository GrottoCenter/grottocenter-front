import fetch from 'isomorphic-fetch';
import { postCreateCaveUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const POST_CAVE = 'POST_CAVE';
export const POST_CAVE_SUCCESS = 'POST_CAVE_SUCCESS';
export const POST_CAVE_FAILURE = 'POST_CAVE_FAILURE';

export const postCaveAction = () => ({
  type: POST_CAVE
});
export const postCaveSuccess = cave => ({
  cave,
  type: POST_CAVE_SUCCESS
});
export const postCaveFailure = (error, httpCode) => ({
  type: POST_CAVE_FAILURE,
  error,
  httpCode
});

export const postCave = data => (dispatch, getState) => {
  dispatch(postCaveAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateCaveUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(postCaveSuccess(res));
    })
    .catch(error =>
      dispatch(
        postCaveFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
