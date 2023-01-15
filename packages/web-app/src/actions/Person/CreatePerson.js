import fetch from 'isomorphic-fetch';
import { postPersonUrl } from '../../conf/apiRoutes';

export const POST_PERSON = 'POST_PERSON';
export const POST_PERSON_SUCCESS = 'POST_PERSON_SUCCESS';
export const POST_PERSON_FAILURE = 'POST_PERSON_FAILURE';

export const postPersonAction = () => ({
  type: POST_PERSON
});

export const postPersonSuccess = caver => ({
  type: POST_PERSON_SUCCESS,
  caver
});

export const postPersonFailure = error => ({
  type: POST_PERSON_FAILURE,
  error
});

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
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => dispatch(postPersonSuccess(JSON.parse(text))))
      .catch(errorMessage => {
        dispatch(postPersonFailure(errorMessage));
      });
  };
