import fetch from 'isomorphic-fetch';
import { restoreOrganizationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_ORGANIZATION = 'RESTORE_ORGANIZATION';
export const RESTORE_ORGANIZATION_SUCCESS = 'RESTORE_ORGANIZATION_SUCCESS';
export const RESTORE_ORGANIZATION_FAILURE = 'RESTORE_ORGANIZATION_FAILURE';

const restoreOrganizationAction = () => ({
  type: RESTORE_ORGANIZATION
});

const restoreOrganizationSuccess = organization => ({
  type: RESTORE_ORGANIZATION_SUCCESS,
  organization
});

const restoreOrganizationFailure = error => ({
  type: RESTORE_ORGANIZATION_FAILURE,
  error
});

export const restoreOrganization =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreOrganizationAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreOrganizationUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreOrganizationSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreOrganizationFailure(errorMessage));
      });
  };
