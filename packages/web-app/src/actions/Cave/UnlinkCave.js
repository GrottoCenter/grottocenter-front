import fetch from 'isomorphic-fetch';
import { checkAuthStatus } from '../utils';
import { unlinkCaveFromOrganizationUrl, unlinkCaveFromCaverUrl } from '../../conf/apiRoutes';

export const UNLINK_CAVE = 'UNLINK_CAVE';
export const UNLINK_CAVE_SUCCESS = 'UNLINK_CAVE_SUCCESS';
export const UNLINK_CAVE_FAILURE = 'UNLINK_CAVE_FAILURE';

export const unlinkCaveAction = () => ({
  type: UNLINK_CAVE
});

export const unlinkCaveSuccess = () => ({
  type: UNLINK_CAVE_SUCCESS
});

export const unlinkCaveFailure = error => ({
  type: UNLINK_CAVE_FAILURE,
  error
});

export const unlinkCave = (caveId, entityId, isOrganization) => (dispatch, getState) => {
  dispatch(unlinkCaveAction());

  const requestOptions = {
    method: 'DELETE',
    headers: getState().login.authorizationHeader
  };

  const endpoint = isOrganization
    ? unlinkCaveFromOrganizationUrl(caveId, entityId)
    : unlinkCaveFromCaverUrl(caveId, entityId);

  return fetch(endpoint, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(() => dispatch(unlinkCaveSuccess()))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(unlinkCaveFailure(error));
      throw error;
    });
};
