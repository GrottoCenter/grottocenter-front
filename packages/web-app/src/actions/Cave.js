import fetch from 'isomorphic-fetch';
import { getCaveUrl, postCreateCaveUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_CAVE_SUCCESS = 'LOAD_CAVE_SUCCESS';
export const LOAD_CAVE_LOADING = 'LOAD_CAVE_LOADING';
export const LOAD_CAVE_ERROR = 'LOAD_CAVE_ERROR';

export const POST_CAVE = 'POST_CAVE';
export const POST_CAVE_SUCCESS = 'POST_CAVE_SUCCESS';
export const POST_CAVE_FAILURE = 'POST_CAVE_FAILURE';

export const postCaveAction = () => ({
  type: POST_CAVE
});
export const postCaveSuccess = () => ({
  type: POST_CAVE_SUCCESS
});
export const postCaveFailure = (error, httpCode) => ({
  type: POST_CAVE_FAILURE,
  error,
  httpCode
});

export const fetchCave = caveId => dispatch => {
  dispatch({ type: LOAD_CAVE_LOADING });

  return fetch(getCaveUrl + caveId)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => dispatch({ type: LOAD_CAVE_SUCCESS, data }))
    .catch(error =>
      dispatch({
        type: LOAD_CAVE_ERROR,
        error: makeErrorMessage(error.message, `Fetching cave id ${caveId}`)
      })
    );
};

export const postCave = data => {
  return (dispatch, getState) => {
    dispatch(postCaveAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCreateCaveUrl, requestOptions).then(response => {
      return response.text().then(responseText => {
        if (response.status >= 400) {
          dispatch(
            postCaveFailure(
              makeErrorMessage(response.status, `Bad request: ${responseText}`),
              response.status
            )
          );
        } else {
          dispatch(postCaveSuccess());
        }
        return response;
      });
    });
  };
};
