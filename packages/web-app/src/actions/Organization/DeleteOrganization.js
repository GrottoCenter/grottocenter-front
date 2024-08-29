import fetch from 'isomorphic-fetch';
import { deleteOrganizationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_ORGANIZATION = 'DELETE_ORGANIZATION';
export const DELETE_ORGANIZATION_SUCCESS = 'DELETE_ORGANIZATION_SUCCESS';
export const DELETE_ORGANIZATION_PERMANENT_SUCCESS =
  'DELETE_ORGANIZATION_PERMANENT_SUCCESS';
export const DELETE_ORGANIZATION_FAILURE = 'DELETE_ORGANIZATION_FAILURE';

const deleteOrganizationAction = () => ({
  type: DELETE_ORGANIZATION
});

const deleteOrganizationSuccess = (organization, isPermanent) => ({
  type: isPermanent
    ? DELETE_ORGANIZATION_PERMANENT_SUCCESS
    : DELETE_ORGANIZATION_SUCCESS,
  organization
});

const deleteOrganizationFailure = error => ({
  type: DELETE_ORGANIZATION_FAILURE,
  error
});

export const deleteOrganization =
  ({ id, entityId, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteOrganizationAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      deleteOrganizationUrl(id, { entityId, isPermanent }),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteOrganizationSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteOrganizationFailure(errorMessage));
      });
  };
