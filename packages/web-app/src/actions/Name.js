import fetch from 'isomorphic-fetch';
import { patchNameUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const UPDATE_NAME = 'UPDATE_NAME';
export const UPDATE_NAME_SUCCESS = 'UPDATE_NAME_SUCCESS';
export const UPDATE_NAME_FAILURE = 'UPDATE_NAME_FAILURE';

export const updateNameAction = () => ({
  type: UPDATE_NAME
});
export const updateNameSuccess = name => ({
  name,
  type: UPDATE_NAME_SUCCESS
});
export const updateNameFailure = (error, httpCode) => ({
  type: UPDATE_NAME_FAILURE,
  error,
  httpCode
});

export const updateName = data => (dispatch, getState) => {
  dispatch(updateNameAction());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(patchNameUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(updateNameSuccess(res));
    })
    .catch(error =>
      dispatch(
        updateNameFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
