import fetch from 'isomorphic-fetch';
import { putHistoryUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_HISTORY = 'UPDATE_HISTORY';
export const UPDATE_HISTORY_SUCCESS = 'UPDATE_HISTORY_SUCCESS';
export const UPDATE_HISTORY_FAILURE = 'UPDATE_HISTORY_FAILURE';

export const updateHistoryAction = () => ({
  type: UPDATE_HISTORY
});

export const updateHistorySuccess = history => ({
  type: UPDATE_HISTORY_SUCCESS,
  history
});

export const updateHistoryFailure = error => ({
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
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(updateHistorySuccess(data)))
      .catch(errorMessage => {
        dispatch(updateHistoryFailure(errorMessage));
      });
  };
