import fetch from 'isomorphic-fetch';
import { changeEmailUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

// ==========
export const FETCH_CHANGE_EMAIL = 'FETCH_CHANGE_EMAIL';
export const FETCH_CHANGE_EMAIL_SUCCESS = 'FETCH_CHANGE_EMAIL_SUCCESS';
export const FETCH_CHANGE_EMAIL_FAILURE = 'FETCH_CHANGE_EMAIL_FAILURE';

// ==========

export const fetchChangeEmail = () => ({
  type: FETCH_CHANGE_EMAIL
});

export const fetchChangeEmailSuccess = () => ({
  type: FETCH_CHANGE_EMAIL_SUCCESS
});

export const fetchChangeEmailFailure = error => ({
  type: FETCH_CHANGE_EMAIL_FAILURE,
  error
});

export const postChangeEmail = email => (dispatch, getState) => {
  dispatch(fetchChangeEmail());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify({ email }),
    headers: getState().login.authorizationHeader
  };

  return fetch(changeEmailUrl, requestOptions)
    .then(response => {
      if (response.ok) {
        // there is no content in the response in case of success
        dispatch(fetchChangeEmailSuccess());
      } else {
        throw response;
      }
    })
    .catch(response => {
      const statusCode = response.status;
      response.text().then(responseText => {
        const errorMessage =
          statusCode === 500
            ? 'A server error occurred, please try again later or contact Wikicaves for more information.'
            : responseText;
        dispatch(
          fetchChangeEmailFailure(
            makeErrorMessage(statusCode, `ChangeEmail - ${errorMessage}`)
          )
        );
      });
    });
};
