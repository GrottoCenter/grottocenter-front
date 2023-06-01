import fetch from 'isomorphic-fetch';
import { getDbExportUrls } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const GET_DB_EXPORT = 'GET_DB_EXPORT';
export const GET_DB_EXPORT_SUCCESS = 'GET_DB_EXPORT_SUCCESS';
export const GET_DB_EXPORT_FAILURE = 'GET_DB_EXPORT_FAILURE';

export function fetchDBExportUrl() {
  return (dispatch, getState) => {
    dispatch({ type: GET_DB_EXPORT });

    return fetch(getDbExportUrls, {
      headers: getState().login.authorizationHeader
    })
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch({
          type: GET_DB_EXPORT_SUCCESS,
          url: data.url,
          size: data.size,
          lastUpdate: data.lastUpdate
        });
      })
      .catch(error => {
        dispatch({ type: GET_DB_EXPORT_FAILURE, error });
      });
  };
}
