import fetch from 'isomorphic-fetch';

import {
  getEntryUrl,
  postCreateEntranceUrl,
  putEntryWithNewEntitiesUrl
} from '../conf/Config';

import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_ENTRY_SUCCESS = 'LOAD_ENTRY_SUCCESS';
export const LOAD_ENTRY_LOADING = 'LOAD_ENTRY_LOADING';
export const LOAD_ENTRY_ERROR = 'LOAD_ENTRY_ERROR';

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

export const UPDATE_ENTRY_SUCCESS = 'UPDATE_ENTRY_SUCCESS';
export const UPDATE_ENTRY_LOADING = 'UPDATE_ENTRY_LOADING';
export const UPDATE_ENTRY_ERROR = 'UPDATE_ENTRY_ERROR';

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

export const fetchEntry = entranceId => (dispatch, getState) => {
  dispatch({ type: LOAD_ENTRY_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getEntryUrl + entranceId, requestOptions)
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

export const postEntrance = data => {
  return (dispatch, getState) => {
    dispatch(postEntranceAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCreateEntranceUrl, requestOptions).then(response => {
      return response.text().then(responseText => {
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
      });
    });
  };
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

export const updateEntryWithNewEntities = (
  entryData,
  newNames,
  newDesc,
  newLoc,
  newRiggings,
  newComments
) => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRY_LOADING });

  const body = {
    entrance: entryData,
    newNames,
    newDescriptions: newDesc,
    newLocations: newLoc,
    newRiggings,
    newComments
  };

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putEntryWithNewEntitiesUrl(entryData.id), requestOptions)
    .then(checkStatus)
    .then(result => {
      dispatch({
        type: UPDATE_ENTRY_SUCCESS,
        httpCode: result.status
      });
    })
    .catch(error => {
      dispatch({
        type: UPDATE_ENTRY_ERROR,
        error: error.message,
        httpCode: error.status
      });
    });
};

export const resetEntryState = () => ({
  type: RESET_ENTRY_STATE
});
