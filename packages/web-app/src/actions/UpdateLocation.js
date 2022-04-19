import fetch from 'isomorphic-fetch';
import { putLocationUrl } from '../conf/Config';

export const UPDATE_LOCATION = 'UPDATE_LOCATION';
export const UPDATE_LOCATION_SUCCESS = 'UPDATE_LOCATION_SUCCESS';
export const UPDATE_LOCATION_FAILURE = 'UPDATE_LOCATION_FAILURE';

export const updateLocationAction = () => ({
  type: UPDATE_LOCATION
});

export const updateLocationSuccess = location => ({
  type: UPDATE_LOCATION_SUCCESS,
  location
});

export const updateLocationFailure = error => ({
  type: UPDATE_LOCATION_FAILURE,
  error
});

export const updateLocation = ({ body, entrance, id, language, title }) => (
  dispatch,
  getState
) => {
  dispatch(updateLocationAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify({ body, entrance, language, title }),
    headers: getState().login.authorizationHeader
  };

  return fetch(putLocationUrl(id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateLocationSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateLocationFailure(errorMessage));
    });
};
