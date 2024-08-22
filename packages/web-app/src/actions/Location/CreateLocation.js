import fetch from 'isomorphic-fetch';
import { postLocationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_LOCATION = 'POST_LOCATION';
export const POST_LOCATION_SUCCESS = 'POST_LOCATION_SUCCESS';
export const POST_LOCATION_FAILURE = 'POST_LOCATION_FAILURE';

const postLocationAction = () => ({
  type: POST_LOCATION
});

const postLocationSuccess = location => ({
  type: POST_LOCATION_SUCCESS,
  location
});

const postLocationFailure = error => ({
  type: POST_LOCATION_FAILURE,
  error
});

export const postLocation =
  ({ entrance, title, body, language }) =>
  (dispatch, getState) => {
    dispatch(postLocationAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ entrance, title, body, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postLocationUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(postLocationSuccess(data)))
      .catch(errorMessage => {
        dispatch(postLocationFailure(errorMessage));
      });
  };
