import fetch from 'isomorphic-fetch';
import { putOrganizationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_ORGANIZATION = 'UPDATE_ORGANIZATION';
export const UPDATE_ORGANIZATION_SUCCESS = 'UPDATE_ORGANIZATION_SUCCESS';
export const UPDATE_ORGANIZATION_FAILURE = 'UPDATE_ORGANIZATION_FAILURE';

const updateOrganizationAction = () => ({
  type: UPDATE_ORGANIZATION
});

const updateOrganizationSuccess = organization => ({
  type: UPDATE_ORGANIZATION_SUCCESS,
  organization
});

const updateOrganizationFailure = error => ({
  type: UPDATE_ORGANIZATION_FAILURE,
  error
});

export const updateOrganization = organizationData => (dispatch, getState) => {
  dispatch(updateOrganizationAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(organizationData),
    headers: getState().login.authorizationHeader
  };

  return fetch(putOrganizationUrl(organizationData.id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(updateOrganizationSuccess(data)))
    .catch(errorMessage => {
      dispatch(updateOrganizationFailure(errorMessage));
    });
};
