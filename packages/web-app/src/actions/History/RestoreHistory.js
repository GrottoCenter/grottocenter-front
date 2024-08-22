import fetch from 'isomorphic-fetch';
import { restoreHistoryUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_HISTORY = 'RESTORE_HISTORY';
export const RESTORE_HISTORY_SUCCESS = 'RESTORE_HISTORY_SUCCESS';
export const RESTORE_HISTORY_FAILURE = 'RESTORE_HISTORY_FAILURE';

const restoreHistoryAction = () => ({
  type: RESTORE_HISTORY
});

const restoreHistorySuccess = history => ({
  type: RESTORE_HISTORY_SUCCESS,
  history
});

const restoreHistoryFailure = error => ({
  type: RESTORE_HISTORY_FAILURE,
  error
});

export const restoreHistory =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreHistoryAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreHistoryUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreHistorySuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreHistoryFailure(errorMessage));
      });
  };
