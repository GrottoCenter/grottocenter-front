import fetch from 'isomorphic-fetch';
import { postLocationUrl } from '../../conf/Config';

export const POST_LOCATION = 'POST_LOCATION';
export const POST_LOCATION_SUCCESS = 'POST_LOCATION_SUCCESS';
export const POST_LOCATION_FAILURE = 'POST_LOCATION_FAILURE';

export const postLocationAction = () => ({
  type: POST_LOCATION
});

export const postLocationSuccess = location => ({
  type: POST_LOCATION_SUCCESS,
  location
});

export const postLocationFailure = error => ({
  type: POST_LOCATION_FAILURE,
  error
});

export const postLocation = ({ body, entrance, language, title }) => (
  dispatch,
  getState
) => {
  dispatch(postLocationAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ body, entrance, language, title }),
    headers: getState().login.authorizationHeader
  };

  return fetch(postLocationUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(postLocationSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(postLocationFailure(errorMessage));
    });
};
