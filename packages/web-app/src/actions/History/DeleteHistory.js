import fetch from 'isomorphic-fetch';
import { deleteHistoryUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const DELETE_HISTORY = 'DELETE_HISTORY';
export const DELETE_HISTORY_SUCCESS = 'DELETE_HISTORY_SUCCESS';
export const DELETE_HISTORY_PERMANENT_SUCCESS =
  'DELETE_HISTORY_PERMANENT_SUCCESS';
export const DELETE_HISTORY_FAILURE = 'DELETE_HISTORY_FAILURE';

const deleteHistoryAction = () => ({
  type: DELETE_HISTORY
});

const deleteHistorySuccess = (history, isPermanent) => ({
  type: isPermanent ? DELETE_HISTORY_PERMANENT_SUCCESS : DELETE_HISTORY_SUCCESS,
  history
});

const deleteHistoryFailure = error => ({
  type: DELETE_HISTORY_FAILURE,
  error
});

export const deleteHistory =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteHistoryAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteHistoryUrl(id, isPermanent), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(deleteHistorySuccess(data, isPermanent)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(deleteHistoryFailure(error));
      });
  };
