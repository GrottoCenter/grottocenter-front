import fetch from 'isomorphic-fetch';

import {
  putEntranceWithNewEntitiesUrl,
  putEntranceUrl
} from '../../conf/Config';

import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UPDATE_ENTRANCE_SUCCESS = 'UPDATE_ENTRANCE_SUCCESS';
export const UPDATE_ENTRANCE = 'UPDATE_ENTRANCE';
export const UPDATE_ENTRANCE_ERROR = 'UPDATE_ENTRANCE_ERROR';
export const updateEntranceFailure = (error, httpCode) => ({
  type: UPDATE_ENTRANCE_ERROR,
  error,
  httpCode
});

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response;
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};

export const updateEntranceWithNewEntities = (
  entranceData,
  newNames,
  newDesc,
  newLoc,
  newRiggings,
  newComments
) => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRANCE });

  const body = {
    entrance: entranceData,
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

  return fetch(putEntranceWithNewEntitiesUrl(entranceData.id), requestOptions)
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

export const updateEntrance = entranceData => (dispatch, getState) => {
  dispatch({ type: UPDATE_ENTRANCE });

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(entranceData),
    headers: getState().login.authorizationHeader
  };

  return fetch(putEntranceUrl(entranceData.id), requestOptions)
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
