import fetch from 'isomorphic-fetch';
import { accountUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';
import { fetchAccount } from './GetAccount';

export const UPDATE_ACCOUNT = 'UPDATE_ACCOUNT';
export const UPDATE_ACCOUNT_SUCCESS = 'UPDATE_ACCOUNT_SUCCESS';
export const UPDATE_ACCOUNT_FAILURE = 'UPDATE_ACCOUNT_FAILURE';

const updateAccountAction = () => ({ type: UPDATE_ACCOUNT });
const updateAccountSuccess = () => ({ type: UPDATE_ACCOUNT_SUCCESS });
const updateAccountFailure = error => ({ type: UPDATE_ACCOUNT_FAILURE, error });

export const updateAccount = fields => (dispatch, getState) => {
  dispatch(updateAccountAction());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify(fields),
    headers: {
      ...getState().login.authorizationHeader,
      'Content-Type': 'application/json'
    }
  };

  return fetch(accountUrl, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(() => dispatch(updateAccountSuccess()))
    .then(() => dispatch(fetchAccount()))
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(updateAccountFailure(error));
      throw error;
    });
};
