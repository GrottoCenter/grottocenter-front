import fetch from 'isomorphic-fetch';
import { deleteMassifUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_MASSIF = 'DELETE_MASSIF';
export const DELETE_MASSIF_SUCCESS = 'DELETE_MASSIF_SUCCESS';
export const DELETE_MASSIF_PERMANENT_SUCCESS =
  'DELETE_MASSIF_PERMANENT_SUCCESS';
export const DELETE_MASSIF_FAILURE = 'DELETE_MASSIF_FAILURE';

const deleteMassifAction = () => ({
  type: DELETE_MASSIF
});

const deleteMassifSuccess = (massif, isPermanent) => ({
  type: isPermanent ? DELETE_MASSIF_PERMANENT_SUCCESS : DELETE_MASSIF_SUCCESS,
  massif
});

const deleteMassifFailure = error => ({
  type: DELETE_MASSIF_FAILURE,
  error
});

export const deleteMassif =
  ({ id, entityId, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteMassifAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteMassifUrl(id, { entityId, isPermanent }), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteMassifSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteMassifFailure(errorMessage));
      });
  };
