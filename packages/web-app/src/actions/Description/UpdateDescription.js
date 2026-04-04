import fetch from 'isomorphic-fetch';
import { putDescriptionUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

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

export const updateDescription =
  ({ id, title, body, language }) =>
  (dispatch, getState) => {
    dispatch(updateDescriptionAction());

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify({ title, body, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(putDescriptionUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(updateDescriptionSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(updateDescriptionFailure(error));
      });
  };
