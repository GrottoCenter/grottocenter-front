import fetch from 'isomorphic-fetch';
import { postCreateMassifUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const POST_MASSIF = 'POST_MASSIF';
export const POST_MASSIF_SUCCESS = 'POST_MASSIF_SUCCESS';
export const POST_MASSIF_FAILURE = 'POST_MASSIF_FAILURE';

const postMassifAction = () => ({
  type: POST_MASSIF
});
const postMassifSuccess = massif => ({
  type: POST_MASSIF_SUCCESS,
  massif
});
const postMassifFailure = error => ({
  type: POST_MASSIF_FAILURE,
  error
});

export const postMassif = body => (dispatch, getState) => {
  dispatch(postMassifAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateMassifUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => {
      dispatch(postMassifSuccess(data));
    })
    .catch(error => dispatch(postMassifFailure(error)));
};
