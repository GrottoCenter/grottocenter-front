import fetch from 'isomorphic-fetch';

import {
  putEntranceWithNewEntitiesUrl,
  putEntranceUrl
} from '../../conf/apiRoutes';

import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkStatusAndGetText } from '../utils';

export const UPDATE_ENTRANCE_SUCCESS = 'UPDATE_ENTRANCE_SUCCESS';
export const UPDATE_ENTRANCE = 'UPDATE_ENTRANCE';
export const UPDATE_ENTRANCE_ERROR = 'UPDATE_ENTRANCE_ERROR';
export const updateEntranceFailure = (error, httpCode) => ({
  type: UPDATE_ENTRANCE_ERROR,
  error,
  httpCode
});

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
    .then(checkStatusAndGetText)
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
