import fetch from 'isomorphic-fetch';
import { putRiggingsUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_RIGGINGS = 'UPDATE_RIGGINGS';
export const UPDATE_RIGGINGS_SUCCESS = 'UPDATE_RIGGINGS_SUCCESS';
export const UPDATE_RIGGINGS_FAILURE = 'UPDATE_RIGGINGS_FAILURE';

export const updateRiggingsAction = () => ({
  type: UPDATE_RIGGINGS
});

export const updateRiggingsSuccess = rigging => ({
  type: UPDATE_RIGGINGS_SUCCESS,
  rigging
});

export const updateRiggingsFailure = error => ({
  type: UPDATE_RIGGINGS_FAILURE,
  error
});

export const updateRiggings = ({ id, title, obstacles, language }) => (
  dispatch,
  getState
) => {
  dispatch(updateRiggingsAction());

  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify({ title, obstacles, language }),
    headers: getState().login.authorizationHeader
  };

  return fetch(putRiggingsUrl(id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(updateRiggingsSuccess(data)))
    .catch(errorMessage => {
      dispatch(updateRiggingsFailure(errorMessage));
    });
};
