import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_LOADING = 'FETCH_CAVE_LOADING';
export const FETCH_CAVE_ERROR = 'FETCH_CAVE_ERROR';

export const fetchCave = caveId => (dispatch, getState) => {
  dispatch({ type: FETCH_CAVE_LOADING });

  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(getCaveUrl + caveId, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch({ type: FETCH_CAVE_SUCCESS, cave: data }))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch({ type: FETCH_CAVE_ERROR, error });
    });
};
