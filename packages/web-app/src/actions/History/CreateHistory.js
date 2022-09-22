import fetch from 'isomorphic-fetch';
import { postHistoryUrl } from '../../conf/apiRoutes';

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

export const postHistory = ({ body, entrance, language }) => (
  dispatch,
  getState
) => {
  dispatch(postHistoryAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ body, entrance, language }),
    headers: getState().login.authorizationHeader
  };

  return fetch(postHistoryUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(postHistorySuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(postHistoryFailure(errorMessage));
    });
};
