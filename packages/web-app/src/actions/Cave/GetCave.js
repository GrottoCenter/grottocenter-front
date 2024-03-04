import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_LOADING = 'FETCH_CAVE_LOADING';
export const FETCH_CAVE_ERROR = 'FETCH_CAVE_ERROR';

export const fetchCave = caveId => (dispatch, getState) => {
  dispatch({ type: FETCH_CAVE_LOADING });

  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(getCaveUrl + caveId, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch({ type: FETCH_CAVE_SUCCESS, data }))
    .catch(error =>
      dispatch({
        type: FETCH_CAVE_ERROR,
        error: makeErrorMessage(error.message, `Fetching cave id ${caveId}`)
      })
    );
};
