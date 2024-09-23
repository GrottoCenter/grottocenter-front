import fetch from 'isomorphic-fetch';
import { postPersonUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_PERSON = 'POST_PERSON';
export const POST_PERSON_SUCCESS = 'POST_PERSON_SUCCESS';
export const POST_PERSON_FAILURE = 'POST_PERSON_FAILURE';

const postPersonAction = () => ({ type: POST_PERSON });
const postPersonSuccess = caver => ({ type: POST_PERSON_SUCCESS, caver });
const postPersonFailure = error => ({ type: POST_PERSON_FAILURE, error });

export const postPerson =
  ({ name, surname }) =>
  (dispatch, getState) => {
    dispatch(postPersonAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ name, surname }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postPersonUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(postPersonSuccess(data)))
      .catch(error => dispatch(postPersonFailure(error)));
  };
