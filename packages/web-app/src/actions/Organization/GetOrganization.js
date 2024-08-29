import fetch from 'isomorphic-fetch';
import { getOrganizationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const FETCH_ORGANIZATION = 'FETCH_ORGANIZATION';
export const FETCH_ORGANIZATION_SUCCESS = 'FETCH_ORGANIZATION_SUCCESS';
export const FETCH_ORGANIZATION_FAILURE = 'FETCH_ORGANIZATION_FAILURE';

export function fetchOrganization(organizationId) {
  return (dispatch, getState) => {
    const requestOptions = {
      headers: getState().login.authorizationHeader
    };

    dispatch({ type: FETCH_ORGANIZATION });
    return fetch(`${getOrganizationUrl}${organizationId}`, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data =>
        dispatch({ type: FETCH_ORGANIZATION_SUCCESS, organization: data })
      )
      .catch(error =>
        dispatch({
          type: FETCH_ORGANIZATION_FAILURE,
          error
        })
      );
  };
}
