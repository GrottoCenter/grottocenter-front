import fetch from 'isomorphic-fetch';
import {
  getGroupsUrl,
  getBannedCaversUrl,
  getInvalidEmailCaversUrl
} from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

// Admin-facing server lists that still live as thunks — they migrate to
// React Query in Phase G (Search & lists) alongside the other admin
// queries. Kept here so ManageUsers.jsx and the three property tests that
// exercise the reducers keep compiling in the meantime.

export const FETCH_GROUPS = 'FETCH_GROUPS';
export const FETCH_GROUPS_SUCCESS = 'FETCH_GROUPS_SUCCESS';
export const FETCH_GROUPS_FAILURE = 'FETCH_GROUPS_FAILURE';

export const FETCH_BANNED_CAVERS = 'FETCH_BANNED_CAVERS';
export const FETCH_BANNED_CAVERS_SUCCESS = 'FETCH_BANNED_CAVERS_SUCCESS';
export const FETCH_BANNED_CAVERS_FAILURE = 'FETCH_BANNED_CAVERS_FAILURE';

export const FETCH_INVALID_EMAIL_CAVERS = 'FETCH_INVALID_EMAIL_CAVERS';
export const FETCH_INVALID_EMAIL_CAVERS_SUCCESS =
  'FETCH_INVALID_EMAIL_CAVERS_SUCCESS';
export const FETCH_INVALID_EMAIL_CAVERS_FAILURE =
  'FETCH_INVALID_EMAIL_CAVERS_FAILURE';

export function fetchGroups() {
  return (dispatch, getState) => {
    dispatch({ type: FETCH_GROUPS });

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getGroupsUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch({ type: FETCH_GROUPS_SUCCESS, groups: data }))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_GROUPS_FAILURE, error });
      });
  };
}

export function fetchBannedCavers() {
  return (dispatch, getState) => {
    dispatch({ type: FETCH_BANNED_CAVERS });

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getBannedCaversUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => {
        if (data.banned === undefined) {
          console.warn(
            'fetchBannedCavers: unexpected API response shape — "banned" field is missing'
          );
        }
        dispatch({
          type: FETCH_BANNED_CAVERS_SUCCESS,
          cavers: data.banned || []
        });
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_BANNED_CAVERS_FAILURE, error });
      });
  };
}

export function fetchInvalidEmailCavers() {
  return (dispatch, getState) => {
    dispatch({ type: FETCH_INVALID_EMAIL_CAVERS });

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getInvalidEmailCaversUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => {
        if (data.cavers === undefined) {
          console.warn(
            'fetchInvalidEmailCavers: unexpected API response shape — "cavers" field is missing'
          );
        }
        dispatch({
          type: FETCH_INVALID_EMAIL_CAVERS_SUCCESS,
          cavers: data.cavers || []
        });
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_INVALID_EMAIL_CAVERS_FAILURE, error });
      });
  };
}
