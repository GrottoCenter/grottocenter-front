import fetch from 'isomorphic-fetch';
import { putCaverUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_PERSON = 'UPDATE_PERSON';
export const UPDATE_PERSON_SUCCESS = 'UPDATE_PERSON_SUCCESS';
export const UPDATE_PERSON_FAILURE = 'UPDATE_PERSON_FAILURE';

const updatePersonAction = () => ({ type: UPDATE_PERSON });
const updatePersonSuccess = person => ({ type: UPDATE_PERSON_SUCCESS, person });
const updatePersonFailure = error => ({ type: UPDATE_PERSON_FAILURE, error });

export const updatePerson = (personId, body) => (dispatch, getState) => {
  dispatch(updatePersonAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putCaverUrl(personId), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(updatePersonSuccess(data)))
    .catch(error => dispatch(updatePersonFailure(error)));
};
