import fetch from 'isomorphic-fetch';
import { cumulatedLengthUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_CUMULATED_LENGTH_SUCCESS = 'FETCH_CUMULATED_LENGTH_SUCCESS';
export const FETCH_CUMULATED_LENGTH_LOADING = 'FETCH_CUMULATED_LENGTH_LOADING';
export const FETCH_CUMULATED_LENGTH_ERROR = 'FETCH_CUMULATED_LENGTH_ERROR';

export const fetchCumulatedLength = () => (dispatch, getState) => {
  dispatch({ type: FETCH_CUMULATED_LENGTH_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(cumulatedLengthUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: FETCH_CUMULATED_LENGTH_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: FETCH_CUMULATED_LENGTH_ERROR,
        error: makeErrorMessage(error.message, `Fetching cumulated length`)
      })
    );
};
