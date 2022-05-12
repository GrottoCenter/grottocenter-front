import fetch from 'isomorphic-fetch';
import { findUserUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_USER = 'FETCH_USER';
export const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
export const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

export const fetchUser = () => ({
  type: FETCH_USER
});

export const fetchUserSuccess = user => ({
  type: FETCH_USER_SUCCESS,
  user
});

export const fetchUserFailure = error => ({
  type: FETCH_USER_FAILURE,
  error
});

export function loadUser(userId) {
  return dispatch => {
    dispatch(fetchUser());

    return fetch(findUserUrl + userId)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => dispatch(fetchUserSuccess(JSON.parse(text))))
      .catch(error =>
        dispatch(
          fetchUserFailure(
            makeErrorMessage(error.message, `Fetching user id ${userId}`)
          )
        )
      );
  };
}
