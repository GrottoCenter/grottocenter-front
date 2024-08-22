import fetch from 'isomorphic-fetch';
import { deleteRiggingsUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_RIGGINGS = 'DELETE_RIGGINGS';
export const DELETE_RIGGINGS_SUCCESS = 'DELETE_RIGGINGS_SUCCESS';
export const DELETE_RIGGINGS_PERMANENT_SUCCESS =
  'DELETE_RIGGINGS_PERMANENT_SUCCESS';
export const DELETE_RIGGINGS_FAILURE = 'DELETE_RIGGINGS_FAILURE';

const deleteRiggingsAction = () => ({
  type: DELETE_RIGGINGS
});

const deleteRiggingsSuccess = (rigging, isPermanent) => ({
  type: isPermanent
    ? DELETE_RIGGINGS_PERMANENT_SUCCESS
    : DELETE_RIGGINGS_SUCCESS,
  rigging
});

const deleteRiggingsFailure = error => ({
  type: DELETE_RIGGINGS_FAILURE,
  error
});

export const deleteRiggings =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteRiggingsAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteRiggingsUrl(id, isPermanent), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteRiggingsSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteRiggingsFailure(errorMessage));
      });
  };
