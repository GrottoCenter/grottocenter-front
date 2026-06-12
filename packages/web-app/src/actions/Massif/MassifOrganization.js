import fetch from 'isomorphic-fetch';
import { putMassifOrganizationUrl, deleteMassifOrganizationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SET_MASSIF_ORGANIZATION = 'SET_MASSIF_ORGANIZATION';
export const SET_MASSIF_ORGANIZATION_SUCCESS = 'SET_MASSIF_ORGANIZATION_SUCCESS';
export const SET_MASSIF_ORGANIZATION_FAILURE = 'SET_MASSIF_ORGANIZATION_FAILURE';

export const REMOVE_MASSIF_ORGANIZATION = 'REMOVE_MASSIF_ORGANIZATION';
export const REMOVE_MASSIF_ORGANIZATION_SUCCESS = 'REMOVE_MASSIF_ORGANIZATION_SUCCESS';
export const REMOVE_MASSIF_ORGANIZATION_FAILURE = 'REMOVE_MASSIF_ORGANIZATION_FAILURE';

// Set Actions
const setMassifOrganizationAction = () => ({ type: SET_MASSIF_ORGANIZATION });
const setMassifOrganizationSuccess = payload => ({ type: SET_MASSIF_ORGANIZATION_SUCCESS, payload });
const setMassifOrganizationFailure = error => ({ type: SET_MASSIF_ORGANIZATION_FAILURE, error });

export const setMassifOrganization = (massifId, organizationId, organizationName) => (dispatch, getState) => {
  dispatch(setMassifOrganizationAction());

  const body = organizationId ? { id: organizationId } : { name: organizationName };

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(putMassifOrganizationUrl(massifId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch(setMassifOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(setMassifOrganizationFailure(error));
    });
};

// Remove Actions
const removeMassifOrganizationAction = () => ({ type: REMOVE_MASSIF_ORGANIZATION });
const removeMassifOrganizationSuccess = payload => ({ type: REMOVE_MASSIF_ORGANIZATION_SUCCESS, payload });
const removeMassifOrganizationFailure = error => ({ type: REMOVE_MASSIF_ORGANIZATION_FAILURE, error });

export const removeMassifOrganization = (massifId, organizationId) => (dispatch, getState) => {
  dispatch(removeMassifOrganizationAction());

  const requestOptions = {
    method: 'DELETE',
    body: JSON.stringify({ id: organizationId }),
    headers: {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(deleteMassifOrganizationUrl(massifId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => {
      if (response.status === 204 || response.status === 200) {
        return response.text().then(text => text ? JSON.parse(text) : {});
      }
      return response.json();
    })
    .then(data => dispatch(removeMassifOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(removeMassifOrganizationFailure(error));
    });
};
