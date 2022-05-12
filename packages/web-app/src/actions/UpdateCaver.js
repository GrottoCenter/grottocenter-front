import fetch from 'isomorphic-fetch';
import { putCaverUrl } from '../conf/Config';

export const UPDATE_CAVER = 'UPDATE_CAVER';
export const UPDATE_CAVER_SUCCESS = 'UPDATE_CAVER_SUCCESS';
export const UPDATE_CAVER_FAILURE = 'UPDATE_CAVER_FAILURE';

export const updateCaverAction = () => ({
  type: UPDATE_CAVER
});

export const updateCaverSuccess = caver => ({
  type: UPDATE_CAVER_SUCCESS,
  caver
});

export const updateCaverFailure = error => ({
  type: UPDATE_CAVER_FAILURE,
  error
});

export const updateCaver = ({ name, surname }) => (dispatch, getState) => {
  dispatch(updateCaverAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify({ name, surname }),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaverUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateCaverSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateCaverFailure(errorMessage));
    });
};
