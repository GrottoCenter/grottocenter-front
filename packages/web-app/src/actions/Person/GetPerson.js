import fetch from 'isomorphic-fetch';
import {
  getAdminsUrl,
  getModeratorsUrl,
  getCaverUrl
} from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

// ==========

export const FETCH_PERSON = 'FETCH_PERSON';
export const FETCH_PERSON_SUCCESS = 'FETCH_PERSON_SUCCESS';
export const FETCH_PERSON_FAILURE = 'FETCH_PERSON_FAILURE';

export const GET_ADMINS = 'GET_ADMINS';
export const GET_ADMINS_SUCCESS = 'GET_ADMINS_SUCCESS';
export const GET_ADMINS_FAILURE = 'GET_ADMINS_FAILURE';

export const GET_MODERATORS = 'GET_MODERATORS';
export const GET_MODERATORS_SUCCESS = 'GET_MODERATORS_SUCCESS';
export const GET_MODERATORS_FAILURE = 'GET_MODERATORS_FAILURE';

// ==========

export const fetchPerson = () => ({
  type: FETCH_PERSON
});

export const fetchPersonSuccess = person => ({
  type: FETCH_PERSON_SUCCESS,
  person
});

export const fetchPersonFailure = error => ({
  type: FETCH_PERSON_FAILURE,
  error
});

export const getAdminsAction = () => ({
  type: GET_ADMINS
});

export const getAdminsActionSuccess = admins => ({
  type: GET_ADMINS_SUCCESS,
  admins
});

export const getAdminsActionFailure = errorMessage => ({
  type: GET_ADMINS_FAILURE,
  errorMessage
});

export function loadPerson(personId) {
  return dispatch => {
    dispatch(fetchPerson());

    return fetch(getCaverUrl + personId)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => dispatch(fetchPersonSuccess(JSON.parse(text))))
      .catch(error =>
        dispatch(
          fetchPersonFailure(
            makeErrorMessage(error.message, `Fetching Person id ${personId}`)
          )
        )
      );
  };
}

export function getAdmins() {
  return (dispatch, getState) => {
    dispatch(getAdminsAction());

    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getAdminsUrl, requestOptions)
      .then(response => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${getAdminsUrl} status: ${response.status}`;
          dispatch(getAdminsActionFailure(errorMessage));
        }
        return response.text();
      })
      .then(text => dispatch(getAdminsActionSuccess(JSON.parse(text).cavers)));
  };
}

export const getModeratorsAction = () => ({
  type: GET_MODERATORS
});

export const getModeratorsActionSuccess = moderators => ({
  type: GET_MODERATORS_SUCCESS,
  moderators
});

export const getModeratorsActionFailure = errorMessage => ({
  type: GET_MODERATORS_FAILURE,
  errorMessage
});

export function getModerators() {
  return (dispatch, getState) => {
    dispatch(getModeratorsAction());
    const requestOptions = {
      method: 'GET',
      headers: getState().login.authorizationHeader
    };

    return fetch(getModeratorsUrl, requestOptions)
      .then(response => {
        if (response.status >= 400) {
          const errorMessage = `Fetching ${getModeratorsUrl} status: ${response.status}`;
          dispatch(getModeratorsActionFailure(errorMessage));
        }
        return response.text();
      })
      .then(text =>
        dispatch(getModeratorsActionSuccess(JSON.parse(text).cavers))
      );
  };
}
