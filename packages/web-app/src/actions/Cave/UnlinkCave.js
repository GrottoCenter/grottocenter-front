import fetch from 'isomorphic-fetch';
import { checkAndGetStatus } from '../utils';
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

  return fetch(unlinkCaveFromOrganizationUrl(caveId, organizationId), requestOptions)
    .then(checkAndGetStatus)
    .then(() => dispatch(unlinkCaveSuccess()))
    .catch(errorMessage => {
      dispatch(unlinkCaveFailure(errorMessage));
      throw errorMessage;
    });
};
