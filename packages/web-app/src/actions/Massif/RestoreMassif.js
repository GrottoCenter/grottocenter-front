import fetch from 'isomorphic-fetch';
import { restoreMassifUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_MASSIF = 'RESTORE_MASSIF';
export const RESTORE_MASSIF_SUCCESS = 'RESTORE_MASSIF_SUCCESS';
export const RESTORE_MASSIF_FAILURE = 'RESTORE_MASSIF_FAILURE';

const restoreMassifAction = () => ({
  type: RESTORE_MASSIF
});

const restoreMassifSuccess = massif => ({
  type: RESTORE_MASSIF_SUCCESS,
  massif
});

const restoreMassifFailure = error => ({
  type: RESTORE_MASSIF_FAILURE,
  error
});

export const restoreMassif =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreMassifAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreMassifUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreMassifSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreMassifFailure(errorMessage));
      });
  };
