import fetch from 'isomorphic-fetch';
import { putHistoryUrl } from '../../conf/Config';

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

export const updateHistory = ({ body, entrance, id, language, title }) => (
  dispatch,
  getState
) => {
  dispatch(updateHistoryAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify({ body, entrance, language, title }),
    headers: getState().login.authorizationHeader
  };

  return fetch(putHistoryUrl(id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateHistorySuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateHistoryFailure(errorMessage));
    });
};
