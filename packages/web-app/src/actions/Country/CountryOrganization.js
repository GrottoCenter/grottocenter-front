import fetch from 'isomorphic-fetch';
import { putCountryOrganizationUrl, deleteCountryOrganizationUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const SET_COUNTRY_ORGANIZATION = 'SET_COUNTRY_ORGANIZATION';
export const SET_COUNTRY_ORGANIZATION_SUCCESS = 'SET_COUNTRY_ORGANIZATION_SUCCESS';
export const SET_COUNTRY_ORGANIZATION_FAILURE = 'SET_COUNTRY_ORGANIZATION_FAILURE';

export const REMOVE_COUNTRY_ORGANIZATION = 'REMOVE_COUNTRY_ORGANIZATION';
export const REMOVE_COUNTRY_ORGANIZATION_SUCCESS = 'REMOVE_COUNTRY_ORGANIZATION_SUCCESS';
export const REMOVE_COUNTRY_ORGANIZATION_FAILURE = 'REMOVE_COUNTRY_ORGANIZATION_FAILURE';

// Set Actions
const setCountryOrganizationAction = () => ({ type: SET_COUNTRY_ORGANIZATION });
const setCountryOrganizationSuccess = payload => ({ type: SET_COUNTRY_ORGANIZATION_SUCCESS, payload });
const setCountryOrganizationFailure = error => ({ type: SET_COUNTRY_ORGANIZATION_FAILURE, error });

export const setCountryOrganization = (countryId, organizationId, organizationName) => (dispatch, getState) => {
  dispatch(setCountryOrganizationAction());

  const body = organizationId ? { id: organizationId } : { name: organizationName };

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(putCountryOrganizationUrl(countryId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch(setCountryOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(setCountryOrganizationFailure(error));
    });
};

// Remove Actions
const removeCountryOrganizationAction = () => ({ type: REMOVE_COUNTRY_ORGANIZATION });
const removeCountryOrganizationSuccess = payload => ({ type: REMOVE_COUNTRY_ORGANIZATION_SUCCESS, payload });
const removeCountryOrganizationFailure = error => ({ type: REMOVE_COUNTRY_ORGANIZATION_FAILURE, error });

export const removeCountryOrganization = (countryId, organizationId) => (dispatch, getState) => {
  dispatch(removeCountryOrganizationAction());

  const requestOptions = {
    method: 'DELETE',
    body: JSON.stringify({ id: organizationId }),
    headers: {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(deleteCountryOrganizationUrl(countryId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => {
      if (response.status === 204 || response.status === 200) {
        return response.text().then(text => text ? JSON.parse(text) : {});
      }
      return response.json();
    })
    .then(data => dispatch(removeCountryOrganizationSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(removeCountryOrganizationFailure(error));
    });
};
