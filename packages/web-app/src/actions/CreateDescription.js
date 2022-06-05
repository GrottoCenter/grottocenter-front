import fetch from 'isomorphic-fetch';
import { postDescriptionUrl } from '../conf/Config';

export const POST_DESCRIPTION = 'POST_DESCRIPTION';
export const POST_DESCRIPTION_SUCCESS = 'POST_DESCRIPTION_SUCCESS';
export const POST_DESCRIPTION_FAILURE = 'POST_DESCRIPTION_FAILURE';

export const postDescriptionAction = () => ({
  type: POST_DESCRIPTION
});

export const postDescriptionSuccess = description => ({
  type: POST_DESCRIPTION_SUCCESS,
  description
});

export const postDescriptionFailure = error => ({
  type: POST_DESCRIPTION_FAILURE,
  error
});

export const postDescription = data => (dispatch, getState) => {
  dispatch(postDescriptionAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postDescriptionUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(postDescriptionSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(postDescriptionFailure(errorMessage));
    });
};
