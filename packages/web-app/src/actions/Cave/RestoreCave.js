import fetch from 'isomorphic-fetch';
import { restoreCaveUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_CAVE = 'RESTORE_CAVE';
export const RESTORE_CAVE_SUCCESS = 'RESTORE_CAVE_SUCCESS';
export const RESTORE_CAVE_FAILURE = 'RESTORE_CAVE_FAILURE';

const restoreCaveAction = () => ({
  type: RESTORE_CAVE
});

const restoreCaveSuccess = cave => ({
  type: RESTORE_CAVE_SUCCESS,
  cave
});

const restoreCaveFailure = error => ({
  type: RESTORE_CAVE_FAILURE,
  error
});

export const restoreCave =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreCaveAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreCaveUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreCaveSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreCaveFailure(errorMessage));
      });
  };
