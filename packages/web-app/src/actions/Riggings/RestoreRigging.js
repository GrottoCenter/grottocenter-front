import fetch from 'isomorphic-fetch';
import { restoreRiggingsUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_RIGGINGS = 'RESTORE_RIGGINGS';
export const RESTORE_RIGGINGS_SUCCESS = 'RESTORE_RIGGINGS_SUCCESS';
export const RESTORE_RIGGINGS_FAILURE = 'RESTORE_RIGGINGS_FAILURE';

const restoreRiggingsAction = () => ({
  type: RESTORE_RIGGINGS
});

const restoreRiggingsSuccess = rigging => ({
  type: RESTORE_RIGGINGS_SUCCESS,
  rigging
});

const restoreRiggingsFailure = error => ({
  type: RESTORE_RIGGINGS_FAILURE,
  error
});

export const restoreRiggings =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreRiggingsAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreRiggingsUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreRiggingsSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreRiggingsFailure(errorMessage));
      });
  };
