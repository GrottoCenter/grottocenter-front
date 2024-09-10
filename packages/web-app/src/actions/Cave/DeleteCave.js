import fetch from 'isomorphic-fetch';
import { deleteCaveUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_CAVE = 'DELETE_CAVE';
export const DELETE_CAVE_SUCCESS = 'DELETE_CAVE_SUCCESS';
export const DELETE_CAVE_PERMANENT_SUCCESS = 'DELETE_CAVE_PERMANENT_SUCCESS';
export const DELETE_CAVE_FAILURE = 'DELETE_CAVE_FAILURE';

const deleteCaveAction = () => ({
  type: DELETE_CAVE
});

const deleteCaveSuccess = (cave, isPermanent) => ({
  type: isPermanent ? DELETE_CAVE_PERMANENT_SUCCESS : DELETE_CAVE_SUCCESS,
  cave
});

const deleteCaveFailure = error => ({
  type: DELETE_CAVE_FAILURE,
  error
});

export const deleteCave =
  ({ id, entityId, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteCaveAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteCaveUrl(id, { entityId, isPermanent }), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteCaveSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteCaveFailure(errorMessage));
      });
  };
