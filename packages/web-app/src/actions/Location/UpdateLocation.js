import fetch from 'isomorphic-fetch';
import { putLocationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';
export const UPDATE_LOCATION_SUCCESS = 'UPDATE_LOCATION_SUCCESS';
export const UPDATE_LOCATION_FAILURE = 'UPDATE_LOCATION_FAILURE';

const updateLocationAction = () => ({
  type: UPDATE_LOCATION
});

const updateLocationSuccess = location => ({
  type: UPDATE_LOCATION_SUCCESS,
  location
});

const updateLocationFailure = error => ({
  type: UPDATE_LOCATION_FAILURE,
  error
});

export const updateLocation =
  ({ id, title, body, language }) =>
  (dispatch, getState) => {
    dispatch(updateLocationAction());

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ title, body, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(putLocationUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(updateLocationSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(updateLocationFailure(error));
        throw error;
      });
  };
