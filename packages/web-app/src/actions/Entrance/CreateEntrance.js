import fetch from 'isomorphic-fetch';

import { postCreateEntranceUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const POST_ENTRANCE = 'POST_ENTRANCE';
export const POST_ENTRANCE_SUCCESS = 'POST_ENTRANCE_SUCCESS';
export const POST_ENTRANCE_FAILURE = 'POST_ENTRANCE_FAILURE';

export const postEntranceAction = () => ({
  type: POST_ENTRANCE
});
export const postEntranceSuccess = () => ({
  type: POST_ENTRANCE_SUCCESS
});
export const postEntranceFailure = (error, httpCode) => ({
  type: POST_ENTRANCE_FAILURE,
  error,
  httpCode
});

export const CREATE_ENTRY_SUCCESS = 'CREATE_ENTRY_SUCCESS';
export const CREATE_ENTRY_LOADING = 'CREATE_ENTRY_LOADING';
export const CREATE_ENTRY_ERROR = 'CREATE_ENTRY_ERROR';

export const RESET_ENTRY_STATE = 'RESET_ENTRY_STATE';

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response;
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};

// TODO: why 2 methods to create entrance? One should be enough

export const postEntrance = data => (dispatch, getState) => {
  dispatch(postEntranceAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateEntranceUrl, requestOptions).then(response =>
    response.text().then(responseText => {
      if (response.status >= 400) {
        dispatch(
          postEntranceFailure(
            makeErrorMessage(response.status, `Bad request: ${responseText}`),
            response.status
          )
        );
      } else {
        dispatch(postEntranceSuccess());
      }
      return response;
    })
  );
};

export const createEntry = entryData => (dispatch, getState) => {
  dispatch({ type: CREATE_ENTRY_LOADING });

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(entryData),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateEntranceUrl, requestOptions)
    .then(checkStatus)
    .then(result => {
      dispatch({
        type: CREATE_ENTRY_SUCCESS,
        httpCode: result.status
      });
    })
    .catch(error => {
      dispatch({
        type: CREATE_ENTRY_ERROR,
        error: error.message
      });
    });
};
