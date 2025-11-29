import fetch from 'isomorphic-fetch';
import { checkAndGetStatus } from '../utils';
import { linkCaveToOrganizationUrl, linkCaveToCaverUrl } from '../../conf/apiRoutes';

export const LINK_CAVE = 'LINK_CAVE';
export const LINK_CAVE_SUCCESS = 'LINK_CAVE_SUCCESS';
export const LINK_CAVE_FAILURE = 'LINK_CAVE_FAILURE';

export const linkCaveAction = () => ({
  type: LINK_CAVE
});

export const linkCaveSuccess = () => ({
  type: LINK_CAVE_SUCCESS
});

export const linkCaveFailure = error => ({
  type: LINK_CAVE_FAILURE,
  error
});

export const linkCave = (caveId, entityId, isOrganization) => (dispatch, getState) => {
  dispatch(linkCaveAction());

  const requestOptions = {
    method: 'PUT',
    headers: getState().login.authorizationHeader
  };

  const endpoint = isOrganization
    ? linkCaveToOrganizationUrl(caveId, entityId)
    : linkCaveToCaverUrl(caveId, entityId);

  return fetch(endpoint, requestOptions)
    .then(checkAndGetStatus)
    .then(() => dispatch(linkCaveSuccess()))
    .catch(errorMessage => {
      dispatch(linkCaveFailure(errorMessage));
      throw errorMessage;
    });
};


