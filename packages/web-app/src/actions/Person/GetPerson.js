import fetch from 'isomorphic-fetch';
import { getGroupsUrl, getCaverUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const FETCH_PERSON = 'FETCH_PERSON';
export const FETCH_PERSON_SUCCESS = 'FETCH_PERSON_SUCCESS';
export const FETCH_PERSON_FAILURE = 'FETCH_PERSON_FAILURE';

export const FETCH_GROUPS = 'FETCH_GROUPS';
export const FETCH_GROUPS_SUCCESS = 'FETCH_GROUPS_SUCCESS';
export const FETCH_GROUPS_FAILURE = 'FETCH_GROUPS_FAILURE';

const fetchPersonAction = () => ({ type: FETCH_PERSON });
const fetchPersonSuccess = person => ({ type: FETCH_PERSON_SUCCESS, person });
const fetchPersonFailure = error => ({ type: FETCH_PERSON_FAILURE, error });

const fetchGroupsAction = () => ({ type: FETCH_GROUPS });
const fetchGroupsSuccess = groups => ({ type: FETCH_GROUPS_SUCCESS, groups });
const fetchGroupsFailure = error => ({ type: FETCH_GROUPS_FAILURE, error });

export function fetchPerson(personId) {
  return dispatch => {
    dispatch(fetchPersonAction());

    return fetch(getCaverUrl + personId)
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
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(fetchGroupsSuccess(data)))
      .catch(error => dispatch(fetchGroupsFailure(error)));
  };
}
