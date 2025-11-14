import fetch from 'isomorphic-fetch';
import { checkAndGetStatus } from '../utils';

export const ADD_CAVE_EXPLORER = 'ADD_CAVE_EXPLORER';
export const ADD_CAVE_EXPLORER_SUCCESS = 'ADD_CAVE_EXPLORER_SUCCESS';
export const ADD_CAVE_EXPLORER_FAILURE = 'ADD_CAVE_EXPLORER_FAILURE';

export const addCaveExplorerAction = () => ({
  type: ADD_CAVE_EXPLORER
});

export const addCaveExplorerSuccess = () => ({
  type: ADD_CAVE_EXPLORER_SUCCESS
});

export const addCaveExplorerFailure = error => ({
  type: ADD_CAVE_EXPLORER_FAILURE,
  error
});

export const addCaveExplorer = (caveId, organizationId) => (dispatch, getState) => {
  dispatch(addCaveExplorerAction());

  const requestOptions = {
    method: 'PUT',
    headers: getState().login.authorizationHeader
  };

  return fetch(
    `${process.env.REACT_APP_API_URL}/api/v1/caves/${caveId}/explorers/${organizationId}`,
    requestOptions
  )
    .then(checkAndGetStatus)
    .then(() => dispatch(addCaveExplorerSuccess()))
    .catch(errorMessage => {
      dispatch(addCaveExplorerFailure(errorMessage));
      throw errorMessage;
    });
};
