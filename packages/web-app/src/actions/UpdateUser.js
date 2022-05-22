import fetch from 'isomorphic-fetch';
import { putCaverUrl } from '../conf/Config';

export const UPDATE_CAVER = 'UPDATE_CAVER';
export const UPDATE_CAVER_SUCCESS = 'UPDATE_CAVER_SUCCESS';
export const UPDATE_CAVER_FAILURE = 'UPDATE_CAVER_FAILURE';

export const updateUserAction = () => ({
  type: UPDATE_CAVER
});

export const updateUserSuccess = user => ({
  type: UPDATE_CAVER_SUCCESS,
  user
});

export const updateUserFailure = error => ({
  type: UPDATE_CAVER_FAILURE,
  error
});

export const updateUser = data => (dispatch, getState) => {
  dispatch(updateUserAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaverUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateUserSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateUserFailure(errorMessage));
    });
};
