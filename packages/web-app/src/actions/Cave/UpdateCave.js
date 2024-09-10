import fetch from 'isomorphic-fetch';
import { putCaveUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_CAVE = 'UPDATE_CAVE';
export const UPDATE_CAVE_SUCCESS = 'UPDATE_CAVE_SUCCESS';
export const UPDATE_CAVE_FAILURE = 'UPDATE_CAVE_FAILURE';

const updateCaveAction = () => ({
  type: UPDATE_CAVE
});
const updateCaveSuccess = cave => ({
  cave,
  type: UPDATE_CAVE_SUCCESS
});
const updateCaveFailure = (error, httpCode) => ({
  type: UPDATE_CAVE_FAILURE,
  error,
  httpCode
});

export const updateCave = body => (dispatch, getState) => {
  dispatch(updateCaveAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaveUrl(body.id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(updateCaveSuccess(data)))
    .catch(error => dispatch(updateCaveFailure(error)));
};
