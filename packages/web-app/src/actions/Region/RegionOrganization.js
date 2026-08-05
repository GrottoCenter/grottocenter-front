import fetch from 'isomorphic-fetch';
import {
  putRegionOrganizationUrl,
  deleteRegionOrganizationUrl,
  postOrganizationUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SET_REGION_ORGANIZATION = 'SET_REGION_ORGANIZATION';
export const SET_REGION_ORGANIZATION_SUCCESS =
  'SET_REGION_ORGANIZATION_SUCCESS';
export const SET_REGION_ORGANIZATION_FAILURE =
  'SET_REGION_ORGANIZATION_FAILURE';

export const REMOVE_REGION_ORGANIZATION = 'REMOVE_REGION_ORGANIZATION';
export const REMOVE_REGION_ORGANIZATION_SUCCESS =
  'REMOVE_REGION_ORGANIZATION_SUCCESS';
export const REMOVE_REGION_ORGANIZATION_FAILURE =
  'REMOVE_REGION_ORGANIZATION_FAILURE';

export const RESET_REGION_ORGANIZATION = 'RESET_REGION_ORGANIZATION';
export const resetRegionOrganization = () => ({
  type: RESET_REGION_ORGANIZATION
});

// Set Actions
const setRegionOrganizationAction = () => ({ type: SET_REGION_ORGANIZATION });
const setRegionOrganizationSuccess = payload => ({
  type: SET_REGION_ORGANIZATION_SUCCESS,
  payload
});
const setRegionOrganizationFailure = error => ({
  type: SET_REGION_ORGANIZATION_FAILURE,
  error
});

export const setRegionOrganization =
  (countryId, regionId, organizationId, organizationName) =>
  (dispatch, getState) => {
    dispatch(setRegionOrganizationAction());

    const authHeaders = {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    };

    let getOrgIdPromise = Promise.resolve(organizationId);

    if (!organizationId && organizationName) {
      const createReqOptions = {
        method: 'POST',
        body: JSON.stringify({
          name: { text: organizationName, language: 'en' }
        }),
        headers: authHeaders
      };
      getOrgIdPromise = fetch(postOrganizationUrl, createReqOptions)
        .then(checkAuthStatus(dispatch))
        .then(response => response.json())
        .then(data => data.id);
    }

    return getOrgIdPromise
      .then(finalOrgId => {
        if (!finalOrgId) {
          throw new Error('Organization ID is missing');
        }
        const requestOptions = {
          method: 'PUT',
          headers: authHeaders
        };
        return fetch(
          putRegionOrganizationUrl(countryId, regionId, finalOrgId),
          requestOptions
        );
      })
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(setRegionOrganizationSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          setRegionOrganizationFailure({
            code: error.body?.code,
            message: error.body?.message,
            details: error.body?.details,
            status: error.status
          })
        );
      });
  };

// Remove Actions
const removeRegionOrganizationAction = () => ({
  type: REMOVE_REGION_ORGANIZATION
});
const removeRegionOrganizationSuccess = payload => ({
  type: REMOVE_REGION_ORGANIZATION_SUCCESS,
  payload
});
const removeRegionOrganizationFailure = error => ({
  type: REMOVE_REGION_ORGANIZATION_FAILURE,
  error
});

export const removeRegionOrganization =
  (countryId, regionId, organizationId) => (dispatch, getState) => {
    dispatch(removeRegionOrganizationAction());

    const requestOptions = {
      method: 'DELETE',
      headers: {
        ...getState().login.authorizationHeader,
        'Content-Type': 'application/json'
      }
    };

    return fetch(
      deleteRegionOrganizationUrl(countryId, regionId, organizationId),
      requestOptions
    )
      .then(checkAuthStatus(dispatch))
      .then(response => {
        if (response.status === 204 || response.status === 200) {
          return response.text().then(text => (text ? JSON.parse(text) : {}));
        }
        return response.json();
      })
      .then(data => dispatch(removeRegionOrganizationSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          removeRegionOrganizationFailure({
            code: error.body?.code,
            message: error.body?.message,
            details: error.body?.details,
            status: error.status
          })
        );
      });
  };
