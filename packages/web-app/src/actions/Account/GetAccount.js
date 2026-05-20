import fetch from 'isomorphic-fetch';
import { accountUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_ACCOUNT = 'FETCH_ACCOUNT';
export const FETCH_ACCOUNT_SUCCESS = 'FETCH_ACCOUNT_SUCCESS';
export const FETCH_ACCOUNT_FAILURE = 'FETCH_ACCOUNT_FAILURE';

const fetchAccountAction = () => ({ type: FETCH_ACCOUNT });
const fetchAccountSuccess = account => ({ type: FETCH_ACCOUNT_SUCCESS, account });
const fetchAccountFailure = error => ({ type: FETCH_ACCOUNT_FAILURE, error });

export const fetchAccount = () => (dispatch, getState) => {
  dispatch(fetchAccountAction());

  const requestOptions = {
    method: 'GET',
    headers: getState().login.authorizationHeader
  };

  return fetch(accountUrl, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch(fetchAccountSuccess(data)))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(fetchAccountFailure(error));
    });
};
