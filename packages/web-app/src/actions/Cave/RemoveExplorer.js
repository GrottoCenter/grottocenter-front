import fetch from 'isomorphic-fetch';
import { checkAndGetStatus } from '../utils';

export const REMOVE_CAVE_EXPLORER = 'REMOVE_CAVE_EXPLORER';
export const REMOVE_CAVE_EXPLORER_SUCCESS = 'REMOVE_CAVE_EXPLORER_SUCCESS';
export const REMOVE_CAVE_EXPLORER_FAILURE = 'REMOVE_CAVE_EXPLORER_FAILURE';

export const removeCaveExplorerAction = () => ({
  type: REMOVE_CAVE_EXPLORER
});

export const removeCaveExplorerSuccess = () => ({
  type: REMOVE_CAVE_EXPLORER_SUCCESS
});

export const removeCaveExplorerFailure = error => ({
  type: REMOVE_CAVE_EXPLORER_FAILURE,
  error
});

export const removeCaveExplorer = (caveId, organizationId) => (dispatch, getState) => {
  dispatch(removeCaveExplorerAction());

  const requestOptions = {
    method: 'DELETE',
    headers: getState().login.authorizationHeader
  };

  return fetch(
    `${process.env.REACT_APP_API_URL}/api/v1/caves/${caveId}/explorers/${organizationId}`,
    requestOptions
  )
    .then(checkAndGetStatus)
    .then(() => dispatch(removeCaveExplorerSuccess()))
    .catch(errorMessage => {
      dispatch(removeCaveExplorerFailure(errorMessage));
      throw errorMessage;
    });
};
