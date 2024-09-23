import fetch from 'isomorphic-fetch';
import { deletePersonUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_PERSON = 'DELETE_PERSON';
export const DELETE_PERSON_PERMANENT_SUCCESS =
  'DELETE_PERSON_PERMANENT_SUCCESS';
export const DELETE_PERSON_FAILURE = 'DELETE_PERSON_FAILURE';

const deletePersonAction = () => ({ type: DELETE_PERSON });
const deletePersonSuccess = () => ({ type: DELETE_PERSON_PERMANENT_SUCCESS });
const deletePersonFailure = error => ({ type: DELETE_PERSON_FAILURE, error });

export const deletePerson =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deletePersonAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deletePersonUrl(id, isPermanent), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deletePersonSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deletePersonFailure(errorMessage));
      });
  };
