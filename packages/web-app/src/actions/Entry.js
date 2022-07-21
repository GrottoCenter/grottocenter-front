import fetch from 'isomorphic-fetch';

import {
  getEntryUrl,
  postCreateEntranceUrl,
  putEntryWithNewEntitiesUrl,
  putEntranceUrl
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

export const UPDATE_ENTRANCE_SUCCESS = 'UPDATE_ENTRANCE_SUCCESS';
export const UPDATE_ENTRANCE = 'UPDATE_ENTRANCE';
export const UPDATE_ENTRANCE_ERROR = 'UPDATE_ENTRANCE_ERROR';
export const updateEntranceFailure = (error, httpCode) => ({
  type: UPDATE_ENTRANCE_ERROR,
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

export const updateEntryWithNewEntities = (
  entryData,
  newNames,
  newDesc,
  newLoc,
  newRiggings,
  newComments
) => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRANCE });

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
        type: UPDATE_ENTRANCE_SUCCESS,
        httpCode: result.status
      });
    })
    .catch(error => {
      dispatch({
        type: UPDATE_ENTRANCE_ERROR,
        error: error.message,
        httpCode: error.status
      });
    });
};

export const updateEntrance = entryData => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRANCE });

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(entryData),
    headers: getState().login.authorizationHeader
  };

  return fetch(putEntranceUrl(entryData.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      } else {
        return response;
      }
    })
    .then(response => {
      dispatch({
        type: UPDATE_ENTRANCE_SUCCESS,
        httpCode: response.status
      });
    })
    .catch(error => {
      const errorCode = Number(error.message);
      dispatch(
        updateEntranceFailure(makeErrorMessage(errorCode, `Update entrance`))
      );
    });
};

export const resetEntryState = () => ({
  type: RESET_ENTRY_STATE
});
