import fetch from 'isomorphic-fetch';
import { putMassifUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const UPDATE_MASSIF = 'UPDATE_MASSIF';
export const UPDATE_MASSIF_SUCCESS = 'UPDATE_MASSIF_SUCCESS';
export const UPDATE_MASSIF_FAILURE = 'UPDATE_MASSIF_FAILURE';

const updateMassifAction = () => ({
  type: UPDATE_MASSIF
});
const updateMassifSuccess = massif => ({
  massif,
  type: UPDATE_MASSIF_SUCCESS
});
const updateMassifFailure = error => ({
  type: UPDATE_MASSIF_FAILURE,
  error
});

export const updateMassif = body => (dispatch, getState) => {
  dispatch(updateMassifAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(putMassifUrl(body.id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => {
      dispatch(updateMassifSuccess(data));
    })
    .catch(error => dispatch(updateMassifFailure(error)));
};
