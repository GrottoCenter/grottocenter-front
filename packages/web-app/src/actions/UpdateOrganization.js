import fetch from 'isomorphic-fetch';
import { putOrganizationUrl } from '../conf/Config';

export const UPDATE_ORGANIZATION = 'UPDATE_ORGANIZATION';
export const UPDATE_ORGANIZATION_SUCCESS = 'UPDATE_ORGANIZATION_SUCCESS';
export const UPDATE_ORGANIZATION_FAILURE = 'UPDATE_ORGANIZATION_FAILURE';

export const updateOrganizationAction = () => ({
  type: UPDATE_ORGANIZATION
});

export const updateOrganizationSuccess = organization => ({
  type: UPDATE_ORGANIZATION_SUCCESS,
  organization
});

export const updateOrganizationFailure = error => ({
  type: UPDATE_ORGANIZATION_FAILURE,
  error
});

export const updateOrganization = data => (dispatch, getState) => {
  dispatch(updateOrganizationAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putOrganizationUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateOrganizationSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateOrganizationFailure(errorMessage));
    });
};
