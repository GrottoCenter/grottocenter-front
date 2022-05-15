import fetch from 'isomorphic-fetch';
import { findOrganizationUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_ORGANIZATION = 'FETCH_ORGANIZATION';
export const FETCH_ORGANIZATION_SUCCESS = 'FETCH_ORGANIZATION_SUCCESS';
export const FETCH_ORGANIZATION_FAILURE = 'FETCH_ORGANIZATION_FAILURE';

export function loadOrganization(organizationId) {
  return dispatch => {
    dispatch({ type: FETCH_ORGANIZATION });
    return fetch(`${findOrganizationUrl}${organizationId}`)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(data =>
        dispatch({ type: FETCH_ORGANIZATION_SUCCESS, organization: data })
      )
      .catch(error =>
        dispatch({
          type: FETCH_ORGANIZATION_FAILURE,
          error: makeErrorMessage(
            error.message,
            `Fetching organization id ${organizationId}`
          )
        })
      );
  };
}
