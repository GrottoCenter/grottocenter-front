import fetch from 'isomorphic-fetch';
import { getEntranceUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const FETCH_ENTRANCE_SUCCESS = 'FETCH_ENTRANCE_SUCCESS';
export const FETCH_ENTRANCE_LOADING = 'FETCH_ENTRANCE_LOADING';
export const FETCH_ENTRANCE_ERROR = 'FETCH_ENTRANCE_ERROR';

export const fetchEntrance = entranceId => (dispatch, getState) => {
  dispatch({ type: FETCH_ENTRANCE_LOADING });
  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(getEntranceUrl + entranceId, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch({ type: FETCH_ENTRANCE_SUCCESS, data }))
    .catch(error => dispatch({ type: FETCH_ENTRANCE_ERROR, error }));
};
