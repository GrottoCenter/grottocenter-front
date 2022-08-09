import fetch from 'isomorphic-fetch';

import { getEntranceUrl } from '../../conf/Config';

import makeErrorMessage from '../../helpers/makeErrorMessage';

export const LOAD_ENTRANCE_SUCCESS = 'LOAD_ENTRANCE_SUCCESS';
export const LOAD_ENTRANCE_LOADING = 'LOAD_ENTRANCE_LOADING';
export const LOAD_ENTRANCE_ERROR = 'LOAD_ENTRANCE_ERROR';

export const fetchEntrance = entranceId => (dispatch, getState) => {
  dispatch({ type: LOAD_ENTRANCE_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getEntranceUrl + entranceId, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: LOAD_ENTRANCE_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: LOAD_ENTRANCE_ERROR,
        error: makeErrorMessage(
          error.message,
          `Fetching entrance id ${entranceId}`
        )
      })
    );
};
