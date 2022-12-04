import fetch from 'isomorphic-fetch';
import { postHistoryUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_HISTORY = 'POST_HISTORY';
export const POST_HISTORY_SUCCESS = 'POST_HISTORY_SUCCESS';
export const POST_HISTORY_FAILURE = 'POST_HISTORY_FAILURE';

export const postHistoryAction = () => ({
  type: POST_HISTORY
});

export const postHistorySuccess = history => ({
  type: POST_HISTORY_SUCCESS,
  history
});

export const postHistoryFailure = error => ({
  type: POST_HISTORY_FAILURE,
  error
});

export const postHistory = ({ entrance, body, language }) => (
  dispatch,
  getState
) => {
  dispatch(postHistoryAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ entrance, body, language }),
    headers: getState().login.authorizationHeader
  };

  return fetch(postHistoryUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(postHistorySuccess(data)))
    .catch(errorMessage => {
      dispatch(postHistoryFailure(errorMessage));
    });
};
