import fetch from 'isomorphic-fetch';
import { postCreateMassifUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const POST_MASSIF = 'POST_MASSIF';
export const POST_MASSIF_SUCCESS = 'POST_MASSIF_SUCCESS';
export const POST_MASSIF_FAILURE = 'POST_MASSIF_FAILURE';

export const postMassifAction = () => ({
  type: POST_MASSIF
});
export const postMassifSuccess = massif => ({
  massif,
  type: POST_MASSIF_SUCCESS
});
export const postMassifFailure = (error, httpCode) => ({
  type: POST_MASSIF_FAILURE,
  error,
  httpCode
});

export const postMassif = data => (dispatch, getState) => {
  dispatch(postMassifAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(postCreateMassifUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(postMassifSuccess(res));
    })
    .catch(error =>
      dispatch(
        postMassifFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
