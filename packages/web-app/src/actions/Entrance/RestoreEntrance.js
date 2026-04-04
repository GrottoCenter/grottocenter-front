import fetch from 'isomorphic-fetch';
import { restoreEntranceUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const RESTORE_ENTRANCE = 'RESTORE_ENTRANCE';
export const RESTORE_ENTRANCE_SUCCESS = 'RESTORE_ENTRANCE_SUCCESS';
export const RESTORE_ENTRANCE_FAILURE = 'RESTORE_ENTRANCE_FAILURE';

const restoreEntranceAction = () => ({
  type: RESTORE_ENTRANCE
});

const restoreEntranceSuccess = data => ({
  type: RESTORE_ENTRANCE_SUCCESS,
  data
});

const restoreEntranceFailure = error => ({
  type: RESTORE_ENTRANCE_FAILURE,
  error
});

export const restoreEntrance =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreEntranceAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreEntranceUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(restoreEntranceSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(restoreEntranceFailure(error));
      });
  };
