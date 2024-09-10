import fetch from 'isomorphic-fetch';

import { postCreateEntranceUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_ENTRANCE = 'POST_ENTRANCE';
export const POST_ENTRANCE_SUCCESS = 'POST_ENTRANCE_SUCCESS';
export const POST_ENTRANCE_FAILURE = 'POST_ENTRANCE_FAILURE';

const postEntranceAction = () => ({
  type: POST_ENTRANCE
});
const postEntranceSuccess = data => ({
  data,
  type: POST_ENTRANCE_SUCCESS
});
const postEntranceFailure = error => ({
  type: POST_ENTRANCE_FAILURE,
  error
});

export const CREATE_ENTRANCE_SUCCESS = 'CREATE_ENTRANCE_SUCCESS';
export const CREATE_ENTRANCE_LOADING = 'CREATE_ENTRANCE_LOADING';
export const CREATE_ENTRANCE_ERROR = 'CREATE_ENTRANCE_ERROR';
export const RESET_ENTRANCE_STATE = 'RESET_ENTRANCE_STATE';

export const postEntrance = data => (dispatch, getState) => {
  dispatch(postEntranceAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateEntranceUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(d => dispatch(postEntranceSuccess(d)))
    .catch(errorMessage => {
      dispatch(postEntranceFailure(errorMessage));
    });
};
