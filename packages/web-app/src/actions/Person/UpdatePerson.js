import fetch from 'isomorphic-fetch';
import { putCaverUrl } from '../../conf/Config';

export const UPDATE_PERSON = 'UPDATE_PERSON';
export const UPDATE_PERSON_SUCCESS = 'UPDATE_PERSON_SUCCESS';
export const UPDATE_PERSON_FAILURE = 'UPDATE_PERSON_FAILURE';

export const updatePersonAction = () => ({
  type: UPDATE_PERSON
});

export const updatePersonSuccess = person => ({
  type: UPDATE_PERSON_SUCCESS,
  person
});

export const updatePersonFailure = error => ({
  type: UPDATE_PERSON_FAILURE,
  error
});

export const updatePerson = (personId, data) => (dispatch, getState) => {
  dispatch(updatePersonAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaverUrl(personId), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updatePersonSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updatePersonFailure(errorMessage));
    });
};
