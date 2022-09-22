import fetch from 'isomorphic-fetch';
import { putDescriptionUrl } from '../../conf/apiRoutes';

export const UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
export const UPDATE_DESCRIPTION_SUCCESS = 'UPDATE_DESCRIPTION_SUCCESS';
export const UPDATE_DESCRIPTION_FAILURE = 'UPDATE_DESCRIPTION_FAILURE';

export const updateDescriptionAction = () => ({
  type: UPDATE_DESCRIPTION
});

export const updateDescriptionSuccess = description => ({
  type: UPDATE_DESCRIPTION_SUCCESS,
  description
});

export const updateDescriptionFailure = error => ({
  type: UPDATE_DESCRIPTION_FAILURE,
  error
});

export const updateDescription = data => (dispatch, getState) => {
  dispatch(updateDescriptionAction());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putDescriptionUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateDescriptionSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateDescriptionFailure(errorMessage));
    });
};
