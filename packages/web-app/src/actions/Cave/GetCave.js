import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_CAVE_SUCCESS = 'FETCH_CAVE_SUCCESS';
export const FETCH_CAVE_LOADING = 'FETCH_CAVE_LOADING';
export const FETCH_CAVE_ERROR = 'FETCH_CAVE_ERROR';

export const fetchCave = caveId => dispatch => {
  dispatch({ type: FETCH_CAVE_LOADING });

  return fetch(getCaveUrl + caveId)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => dispatch({ type: FETCH_CAVE_SUCCESS, data }))
    .catch(error =>
      dispatch({
        type: FETCH_CAVE_ERROR,
        error: makeErrorMessage(error.message, `Fetching cave id ${caveId}`)
      })
    );
};
