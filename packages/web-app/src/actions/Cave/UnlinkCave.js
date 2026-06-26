import fetch from 'isomorphic-fetch';
import { checkAuthStatus } from '../utils';
import { unlinkCaveFromOrganizationUrl } from '../../conf/apiRoutes';

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

export const unlinkCave = (caveId, organizationId) => (dispatch, getState) => {
  dispatch(unlinkCaveAction());

  const requestOptions = {
    method: 'DELETE',
    headers: getState().login.authorizationHeader
  };

  return fetch(
    unlinkCaveFromOrganizationUrl(caveId, organizationId),
    requestOptions
  )
    .then(checkAuthStatus(dispatch))
    .then(() => dispatch(unlinkCaveSuccess()))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(unlinkCaveFailure(error));
      throw error;
    });
};
