import fetch from 'isomorphic-fetch';
import { postCreateCaveUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_CAVE = 'POST_CAVE';
export const POST_CAVE_SUCCESS = 'POST_CAVE_SUCCESS';
export const POST_CAVE_FAILURE = 'POST_CAVE_FAILURE';

export const postCaveAction = () => ({
  type: POST_CAVE
});
export const postCaveSuccess = cave => ({
  cave,
  type: POST_CAVE_SUCCESS
});
export const postCaveFailure = (error, httpCode) => ({
  type: POST_CAVE_FAILURE,
  error,
  httpCode
});

export const postCave = body => (dispatch, getState) => {
  dispatch(postCaveAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateCaveUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(postCaveSuccess(data)))
    .catch(error => dispatch(postCaveFailure(error)));
};
