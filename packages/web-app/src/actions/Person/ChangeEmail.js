import fetch from 'isomorphic-fetch';
import { changeEmailUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_CHANGE_EMAIL = 'FETCH_CHANGE_EMAIL';
export const FETCH_CHANGE_EMAIL_SUCCESS = 'FETCH_CHANGE_EMAIL_SUCCESS';
export const FETCH_CHANGE_EMAIL_FAILURE = 'FETCH_CHANGE_EMAIL_FAILURE';

const fetchChangeEmail = () => ({ type: FETCH_CHANGE_EMAIL });
const fetchChangeEmailSuccess = () => ({ type: FETCH_CHANGE_EMAIL_SUCCESS });
const fetchChangeEmailFailure = error => ({
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
    .then(checkAuthStatus(dispatch))
    .then(() => dispatch(fetchChangeEmailSuccess()))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(fetchChangeEmailFailure(error));
    });
};
