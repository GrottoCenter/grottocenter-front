import fetch from 'isomorphic-fetch';
import {
  putCountryOrganizationUrl,
  deleteCountryOrganizationUrl,
  postOrganizationUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SET_COUNTRY_ORGANIZATION = 'SET_COUNTRY_ORGANIZATION';
export const SET_COUNTRY_ORGANIZATION_SUCCESS =
  'SET_COUNTRY_ORGANIZATION_SUCCESS';
export const SET_COUNTRY_ORGANIZATION_FAILURE =
  'SET_COUNTRY_ORGANIZATION_FAILURE';

export const REMOVE_COUNTRY_ORGANIZATION = 'REMOVE_COUNTRY_ORGANIZATION';
export const REMOVE_COUNTRY_ORGANIZATION_SUCCESS =
  'REMOVE_COUNTRY_ORGANIZATION_SUCCESS';
export const REMOVE_COUNTRY_ORGANIZATION_FAILURE =
  'REMOVE_COUNTRY_ORGANIZATION_FAILURE';

export const RESET_COUNTRY_ORGANIZATION = 'RESET_COUNTRY_ORGANIZATION';
export const resetCountryOrganization = () => ({
  type: RESET_COUNTRY_ORGANIZATION
});

// Set Actions
const setCountryOrganizationAction = () => ({ type: SET_COUNTRY_ORGANIZATION });
const setCountryOrganizationSuccess = payload => ({
  type: SET_COUNTRY_ORGANIZATION_SUCCESS,
  payload
});
const setCountryOrganizationFailure = error => ({
  type: SET_COUNTRY_ORGANIZATION_FAILURE,
  error
});

export const setCountryOrganization =
  (countryId, organizationId, organizationName) => (dispatch, getState) => {
    dispatch(setCountryOrganizationAction());

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
          putCountryOrganizationUrl(countryId, finalOrgId),
          requestOptions
        );
      })
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(setCountryOrganizationSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          setCountryOrganizationFailure({
            code: error.body?.code,
            message: error.body?.message,
            details: error.body?.details,
            status: error.status
          })
        );
      });
  };

// Remove Actions
const removeCountryOrganizationAction = () => ({
  type: REMOVE_COUNTRY_ORGANIZATION
});
const removeCountryOrganizationSuccess = payload => ({
  type: REMOVE_COUNTRY_ORGANIZATION_SUCCESS,
  payload
});
const removeCountryOrganizationFailure = error => ({
  type: REMOVE_COUNTRY_ORGANIZATION_FAILURE,
  error
});

export const removeCountryOrganization =
  (countryId, organizationId) => (dispatch, getState) => {
    dispatch(removeCountryOrganizationAction());

    const requestOptions = {
      method: 'DELETE',
      headers: {
        ...getState().login.authorizationHeader,
        'Content-Type': 'application/json'
      }
    };

    return fetch(
      deleteCountryOrganizationUrl(countryId, organizationId),
      requestOptions
    )
      .then(checkAuthStatus(dispatch))
      .then(response => {
        if (response.status === 204 || response.status === 200) {
          return response.text().then(text => (text ? JSON.parse(text) : {}));
        }
        return response.json();
      })
      .then(data => dispatch(removeCountryOrganizationSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          removeCountryOrganizationFailure({
            code: error.body?.code,
            message: error.body?.message,
            details: error.body?.details,
            status: error.status
          })
        );
      });
  };
