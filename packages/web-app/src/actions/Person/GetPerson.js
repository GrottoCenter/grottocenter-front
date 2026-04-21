import fetch from 'isomorphic-fetch';
import {
  getGroupsUrl,
  getBannedCaversUrl,
  getInvalidEmailCaversUrl,
  getCaverUrl
} from '../../conf/apiRoutes';
import { checkAndGetStatus, checkAuthStatus } from '../utils';
import { hasRole } from '../../helpers/AuthHelper';

export const FETCH_PERSON = 'FETCH_PERSON';
export const FETCH_PERSON_SUCCESS = 'FETCH_PERSON_SUCCESS';
export const FETCH_PERSON_FAILURE = 'FETCH_PERSON_FAILURE';

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

const fetchPersonAction = () => ({ type: FETCH_PERSON });
const fetchPersonSuccess = person => ({ type: FETCH_PERSON_SUCCESS, person });
const fetchPersonFailure = error => ({ type: FETCH_PERSON_FAILURE, error });

const fetchGroupsAction = () => ({ type: FETCH_GROUPS });
const fetchGroupsSuccess = groups => ({ type: FETCH_GROUPS_SUCCESS, groups });
const fetchGroupsFailure = error => ({ type: FETCH_GROUPS_FAILURE, error });

const fetchBannedCaversAction = () => ({ type: FETCH_BANNED_CAVERS });
const fetchBannedCaversSuccess = cavers => ({
  type: FETCH_BANNED_CAVERS_SUCCESS,
  cavers
});
const fetchBannedCaversFailure = error => ({
  type: FETCH_BANNED_CAVERS_FAILURE,
  error
});

const fetchInvalidEmailCaversAction = () => ({
  type: FETCH_INVALID_EMAIL_CAVERS
});
const fetchInvalidEmailCaversSuccess = cavers => ({
  type: FETCH_INVALID_EMAIL_CAVERS_SUCCESS,
  cavers
});
const fetchInvalidEmailCaversFailure = error => ({
  type: FETCH_INVALID_EMAIL_CAVERS_FAILURE,
  error
});

export function fetchPerson(personId) {
  return (dispatch, getState) => {
    dispatch(fetchPersonAction());

    const loginState = getState().login;
    const { authorizationHeader } = loginState;
    const isAdmin = hasRole(loginState, 'Administrator');
    const requestOptions =
      isAdmin && authorizationHeader
        ? { headers: authorizationHeader }
        : {};

    return fetch(getCaverUrl + personId, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(fetchPersonSuccess(data)))
      .catch(error => dispatch(fetchPersonFailure(error)));
  };
}

export function fetchGroups() {
  return (dispatch, getState) => {
    dispatch(fetchGroupsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getGroupsUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(fetchGroupsSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(fetchGroupsFailure(error));
      });
  };
}

export function fetchBannedCavers() {
  return (dispatch, getState) => {
    dispatch(fetchBannedCaversAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getBannedCaversUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => {
        if (data.banned === undefined) {
          // eslint-disable-next-line no-console
          console.warn(
            'fetchBannedCavers: unexpected API response shape — "banned" field is missing'
          );
        }
        dispatch(fetchBannedCaversSuccess(data.banned || []));
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(fetchBannedCaversFailure(error));
      });
  };
}

export function fetchInvalidEmailCavers() {
  return (dispatch, getState) => {
    dispatch(fetchInvalidEmailCaversAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getInvalidEmailCaversUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => {
        if (data.cavers === undefined) {
          // eslint-disable-next-line no-console
          console.warn(
            'fetchInvalidEmailCavers: unexpected API response shape — "cavers" field is missing'
          );
        }
        dispatch(fetchInvalidEmailCaversSuccess(data.cavers || []));
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(fetchInvalidEmailCaversFailure(error));
      });
  };
}
