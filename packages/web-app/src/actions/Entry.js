import fetch from 'isomorphic-fetch';
import { getEntryUrl, postEntryUrl, putEntryUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_ENTRY_SUCCESS = 'LOAD_ENTRY_SUCCESS';
export const LOAD_ENTRY_LOADING = 'LOAD_ENTRY_LOADING';
export const LOAD_ENTRY_ERROR = 'LOAD_ENTRY_ERROR';

export const UPDATE_ENTRY_SUCCESS = 'UPDATE_ENTRY_SUCCESS';
export const UPDATE_ENTRY_LOADING = 'UPDATE_ENTRY_LOADING';
export const UPDATE_ENTRY_ERROR = 'UPDATE_ENTRY_ERROR';

export const CREATE_ENTRY_SUCCESS = 'CREATE_ENTRY_SUCCESS';
export const CREATE_ENTRY_LOADING = 'CREATE_ENTRY_LOADING';
export const CREATE_ENTRY_ERROR = 'CREATE_ENTRY_ERROR';

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response;
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};

export const fetchEntry = entranceId => dispatch => {
  dispatch({ type: LOAD_ENTRY_LOADING });

  return fetch(getEntryUrl + entranceId)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: LOAD_ENTRY_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: LOAD_ENTRY_ERROR,
        error: makeErrorMessage(
          error.message,
          `Fetching entrance id ${entranceId}`
        )
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

  return fetch(postEntryUrl, requestOptions)
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

export const updateEntry = entryData => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRY_LOADING });

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(entryData),
    headers: getState().login.authorizationHeader
  };

  return fetch(putEntryUrl(entryData.id), requestOptions)
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
        error: error.message,
        httpCode: error.status
      });
    });
};
