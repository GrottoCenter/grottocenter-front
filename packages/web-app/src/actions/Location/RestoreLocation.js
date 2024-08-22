import fetch from 'isomorphic-fetch';
import { restoreLocationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_LOCATION = 'RESTORE_LOCATION';
export const RESTORE_LOCATION_SUCCESS = 'RESTORE_LOCATION_SUCCESS';
export const RESTORE_LOCATION_FAILURE = 'RESTORE_LOCATION_FAILURE';

const restoreLocationAction = () => ({
  type: RESTORE_LOCATION
});

const restoreLocationSuccess = location => ({
  type: RESTORE_LOCATION_SUCCESS,
  location
});

const restoreLocationFailure = error => ({
  type: RESTORE_LOCATION_FAILURE,
  error
});

export const restoreLocation =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreLocationAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreLocationUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreLocationSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreLocationFailure(errorMessage));
      });
  };
