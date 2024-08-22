import fetch from 'isomorphic-fetch';
import { deleteLocationUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_LOCATION = 'DELETE_LOCATION';
export const DELETE_LOCATION_SUCCESS = 'DELETE_LOCATION_SUCCESS';
export const DELETE_LOCATION_PERMANENT_SUCCESS =
  'DELETE_LOCATION_PERMANENT_SUCCESS';
export const DELETE_LOCATION_FAILURE = 'DELETE_LOCATION_FAILURE';

const deleteLocationAction = () => ({
  type: DELETE_LOCATION
});

const deleteLocationSuccess = (location, isPermanent) => ({
  type: isPermanent
    ? DELETE_LOCATION_PERMANENT_SUCCESS
    : DELETE_LOCATION_SUCCESS,
  location
});

const deleteLocationFailure = error => ({
  type: DELETE_LOCATION_FAILURE,
  error
});

export const deleteLocation =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteLocationAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteLocationUrl(id, isPermanent), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteLocationSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteLocationFailure(errorMessage));
      });
  };
