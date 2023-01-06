import fetch from 'isomorphic-fetch';

import { getSnapshotsUrl } from '../../conf/apiRoutes';

import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_SNAPSHOT_SUCCESS = 'FETCH_SNAPSHOT_SUCCESS';
export const FETCH_SNAPSHOT_LOADING = 'FETCH_SNAPSHOT_LOADING';
export const FETCH_SNAPSHOT_ERROR = 'FETCH_SNAPSHOT_ERROR';

export const fetchSnapshot = (typeId, typeName) => (dispatch, getState) => {
  dispatch({ type: FETCH_SNAPSHOT_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getSnapshotsUrl(typeId, typeName), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: FETCH_SNAPSHOT_SUCCESS, data });
    })
    .catch(error => {
      dispatch({
        type: FETCH_SNAPSHOT_ERROR,
        error: makeErrorMessage(
          error.message,
          `Fetching snapshot for typeName=${typeName} and id=${typeId}`
        ),
        httpCode: +error.message
      });
    });
};
