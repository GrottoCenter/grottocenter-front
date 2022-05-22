import fetch from 'isomorphic-fetch';
import { findUserUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_PERSON = 'FETCH_PERSON';
export const FETCH_PERSON_SUCCESS = 'FETCH_PERSON_SUCCESS';
export const FETCH_PERSON_FAILURE = 'FETCH_PERSON_FAILURE';

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

export function loadPerson(personId) {
  return dispatch => {
    dispatch(fetchPerson());

    return fetch(findUserUrl + personId)
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
