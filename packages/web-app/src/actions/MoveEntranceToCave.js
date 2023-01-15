import fetch from 'isomorphic-fetch';
import { moveEntranceToCaveUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const MOVE_ENTRANCE_TO_CAVE = 'MOVE_ENTRANCE_TO_CAVE';
export const MOVE_ENTRANCE_TO_CAVE_SUCCESS = 'MOVE_ENTRANCE_TO_CAVE_SUCCESS';
export const MOVE_ENTRANCE_TO_CAVE_FAILURE = 'MOVE_ENTRANCE_TO_CAVE_FAILURE';

export const moveEntranceToCaveAction = () => ({
  type: MOVE_ENTRANCE_TO_CAVE
});
export const moveEntranceToCaveSuccess = cave => ({
  cave,
  type: MOVE_ENTRANCE_TO_CAVE_SUCCESS
});
export const moveEntranceToCaveFailure = (error, httpCode) => ({
  type: MOVE_ENTRANCE_TO_CAVE_FAILURE,
  error,
  httpCode
});

export const moveEntranceToCave =
  (entranceId, caveId) => (dispatch, getState) => {
    dispatch(moveEntranceToCaveAction());

    const requestOptions = {
      method: 'PATCH',
      headers: getState().login.authorizationHeader
    };

    return fetch(moveEntranceToCaveUrl(entranceId, caveId), requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(moveEntranceToCaveSuccess(res));
      })
      .catch(error =>
        dispatch(
          moveEntranceToCaveFailure(
            makeErrorMessage(
              error.message,
              error.message >= 500 ? 'Server error' : 'Bad request'
            ),
            error.message
          )
        )
      );
  };
