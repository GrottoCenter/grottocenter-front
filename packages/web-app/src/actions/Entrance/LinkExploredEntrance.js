import { checkAuthStatus } from '../utils';
import { linkExploredEntranceUrl } from '../../conf/apiRoutes';

export const LINK_EXPLORED_ENTRANCE = 'LINK_EXPLORED_ENTRANCE';
export const LINK_EXPLORED_ENTRANCE_SUCCESS = 'LINK_EXPLORED_ENTRANCE_SUCCESS';
export const LINK_EXPLORED_ENTRANCE_FAILURE = 'LINK_EXPLORED_ENTRANCE_FAILURE';

export const linkExploredEntranceAction = () => ({
  type: LINK_EXPLORED_ENTRANCE
});

export const linkExploredEntranceSuccess = () => ({
  type: LINK_EXPLORED_ENTRANCE_SUCCESS
});

export const linkExploredEntranceFailure = error => ({
  type: LINK_EXPLORED_ENTRANCE_FAILURE,
  error
});

export const linkExploredEntrance =
  (entranceId, caverId) => (dispatch, getState) => {
    dispatch(linkExploredEntranceAction());

    const requestOptions = {
      method: 'PUT',
      headers: getState().login.authorizationHeader
    };

    return fetch(linkExploredEntranceUrl(entranceId, caverId), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(() => dispatch(linkExploredEntranceSuccess()))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(linkExploredEntranceFailure(error));
        throw error;
      });
  };
