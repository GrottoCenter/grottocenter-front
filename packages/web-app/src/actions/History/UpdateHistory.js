import fetch from 'isomorphic-fetch';
import { putHistoryUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const UPDATE_HISTORY = 'UPDATE_HISTORY';
export const UPDATE_HISTORY_SUCCESS = 'UPDATE_HISTORY_SUCCESS';
export const UPDATE_HISTORY_FAILURE = 'UPDATE_HISTORY_FAILURE';

const updateHistoryAction = () => ({
  type: UPDATE_HISTORY
});

const updateHistorySuccess = history => ({
  type: UPDATE_HISTORY_SUCCESS,
  history
});

const updateHistoryFailure = error => ({
  type: UPDATE_HISTORY_FAILURE,
  error
});

export const updateHistory =
  ({ id, body, language }) =>
  (dispatch, getState) => {
    dispatch(updateHistoryAction());

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ body, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(putHistoryUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(updateHistorySuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(updateHistoryFailure(error));
        throw error;
      });
  };
