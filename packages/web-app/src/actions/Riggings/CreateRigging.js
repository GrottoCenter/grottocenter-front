import fetch from 'isomorphic-fetch';
import { postRiggingsUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_RIGGINGS = 'POST_RIGGINGS';
export const POST_RIGGINGS_SUCCESS = 'POST_RIGGINGS_SUCCESS';
export const POST_RIGGINGS_FAILURE = 'POST_RIGGINGS_FAILURE';

const postRiggingsAction = () => ({
  type: POST_RIGGINGS
});

const postRiggingsSuccess = rigging => ({
  type: POST_RIGGINGS_SUCCESS,
  rigging
});

const postRiggingsFailure = error => ({
  type: POST_RIGGINGS_FAILURE,
  error
});

export const postRiggings =
  ({ entrance, title, obstacles, language }) =>
  (dispatch, getState) => {
    dispatch(postRiggingsAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({ entrance, title, obstacles, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(postRiggingsUrl, requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(postRiggingsSuccess(data)))
      .catch(errorMessage => {
        dispatch(postRiggingsFailure(errorMessage));
      });
  };
