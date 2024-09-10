import fetch from 'isomorphic-fetch';
import { deleteEntranceUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_ENTRANCE = 'DELETE_ENTRANCE';
export const DELETE_ENTRANCE_SUCCESS = 'DELETE_ENTRANCE_SUCCESS';
export const DELETE_ENTRANCE_PERMANENT_SUCCESS =
  'DELETE_ENTRANCE_PERMANENT_SUCCESS';
export const DELETE_ENTRANCE_FAILURE = 'DELETE_ENTRANCE_FAILURE';

const deleteEntranceAction = () => ({
  type: DELETE_ENTRANCE
});

const deleteEntranceSuccess = (data, isPermanent) => ({
  type: isPermanent
    ? DELETE_ENTRANCE_PERMANENT_SUCCESS
    : DELETE_ENTRANCE_SUCCESS,
  data
});

const deleteEntranceFailure = error => ({
  type: DELETE_ENTRANCE_FAILURE,
  error
});

export const deleteEntrance =
  ({ id, entityId, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteEntranceAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      deleteEntranceUrl(id, { entityId, isPermanent }),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteEntranceSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteEntranceFailure(errorMessage));
      });
  };
