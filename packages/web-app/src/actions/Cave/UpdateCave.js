import fetch from 'isomorphic-fetch';
import { putCaveUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UPDATE_CAVE = 'UPDATE_CAVE';
export const UPDATE_CAVE_SUCCESS = 'UPDATE_CAVE_SUCCESS';
export const UPDATE_CAVE_FAILURE = 'UPDATE_CAVE_FAILURE';

export const updateCaveAction = () => ({
  type: UPDATE_CAVE
});
export const updateCaveSuccess = cave => ({
  cave,
  type: UPDATE_CAVE_SUCCESS
});
export const updateCaveFailure = (error, httpCode) => ({
  type: UPDATE_CAVE_FAILURE,
  error,
  httpCode
});

export const updateCave = data => (dispatch, getState) => {
  dispatch(updateCaveAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaveUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(updateCaveSuccess(res));
    })
    .catch(error =>
      dispatch(
        updateCaveFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
