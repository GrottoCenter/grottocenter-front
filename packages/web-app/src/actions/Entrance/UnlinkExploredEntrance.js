import { checkAuthStatus } from '../utils';
import { unlinkExploredEntranceUrl } from '../../conf/apiRoutes';

export const UNLINK_EXPLORED_ENTRANCE = 'UNLINK_EXPLORED_ENTRANCE';
export const UNLINK_EXPLORED_ENTRANCE_SUCCESS =
  'UNLINK_EXPLORED_ENTRANCE_SUCCESS';
export const UNLINK_EXPLORED_ENTRANCE_FAILURE =
  'UNLINK_EXPLORED_ENTRANCE_FAILURE';

export const unlinkExploredEntranceAction = () => ({
  type: UNLINK_EXPLORED_ENTRANCE
});

export const unlinkExploredEntranceSuccess = () => ({
  type: UNLINK_EXPLORED_ENTRANCE_SUCCESS
});

export const unlinkExploredEntranceFailure = error => ({
  type: UNLINK_EXPLORED_ENTRANCE_FAILURE,
  error
});

export const unlinkExploredEntrance =
  (entranceId, caverId) => (dispatch, getState) => {
    dispatch(unlinkExploredEntranceAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(unlinkExploredEntranceUrl(entranceId, caverId), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(() => dispatch(unlinkExploredEntranceSuccess()))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(unlinkExploredEntranceFailure(error));
        throw error;
      });
  };
