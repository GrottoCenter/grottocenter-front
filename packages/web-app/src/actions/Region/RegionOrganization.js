import fetch from 'isomorphic-fetch';
import { putRegionOrganizationUrl, deleteRegionOrganizationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SET_REGION_ORGANIZATION = 'SET_REGION_ORGANIZATION';
export const SET_REGION_ORGANIZATION_SUCCESS = 'SET_REGION_ORGANIZATION_SUCCESS';
export const SET_REGION_ORGANIZATION_FAILURE = 'SET_REGION_ORGANIZATION_FAILURE';

export const REMOVE_REGION_ORGANIZATION = 'REMOVE_REGION_ORGANIZATION';
export const REMOVE_REGION_ORGANIZATION_SUCCESS = 'REMOVE_REGION_ORGANIZATION_SUCCESS';
export const REMOVE_REGION_ORGANIZATION_FAILURE = 'REMOVE_REGION_ORGANIZATION_FAILURE';

// Set Actions
const setRegionOrganizationAction = () => ({ type: SET_REGION_ORGANIZATION });
const setRegionOrganizationSuccess = payload => ({ type: SET_REGION_ORGANIZATION_SUCCESS, payload });
const setRegionOrganizationFailure = error => ({ type: SET_REGION_ORGANIZATION_FAILURE, error });

export const setRegionOrganization = (countryId, regionId, organizationId, organizationName) => (dispatch, getState) => {
  dispatch(setRegionOrganizationAction());

  const body = organizationId ? { id: organizationId } : { name: organizationName };

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putRegionOrganizationUrl(countryId, regionId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch(setRegionOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(setRegionOrganizationFailure(error));
    });
};

// Remove Actions
const removeRegionOrganizationAction = () => ({ type: REMOVE_REGION_ORGANIZATION });
const removeRegionOrganizationSuccess = payload => ({ type: REMOVE_REGION_ORGANIZATION_SUCCESS, payload });
const removeRegionOrganizationFailure = error => ({ type: REMOVE_REGION_ORGANIZATION_FAILURE, error });

export const removeRegionOrganization = (countryId, regionId, organizationId) => (dispatch, getState) => {
  dispatch(removeRegionOrganizationAction());

  const requestOptions = {
    method: 'DELETE',
    body: JSON.stringify({ id: organizationId }),
    headers: getState().login.authorizationHeader
  };

  return fetch(deleteRegionOrganizationUrl(countryId, regionId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => {
      if (response.status === 204 || response.status === 200) {
        return response.text().then(text => text ? JSON.parse(text) : {});
      }
      return response.json();
    })
    .then(data => dispatch(removeRegionOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(removeRegionOrganizationFailure(error));
    });
};
