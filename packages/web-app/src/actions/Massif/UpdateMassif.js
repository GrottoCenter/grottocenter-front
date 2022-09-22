import fetch from 'isomorphic-fetch';
import { putMassifUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UPDATE_MASSIF = 'UPDATE_MASSIF';
export const UPDATE_MASSIF_SUCCESS = 'UPDATE_MASSIF_SUCCESS';
export const UPDATE_MASSIF_FAILURE = 'UPDATE_MASSIF_FAILURE';

export const updateMassifAction = () => ({
  type: UPDATE_MASSIF
});
export const updateMassifSuccess = massif => ({
  massif,
  type: UPDATE_MASSIF_SUCCESS
});
export const updateMassifFailure = (error, httpCode) => ({
  type: UPDATE_MASSIF_FAILURE,
  error,
  httpCode
});

export const updateMassif = data => (dispatch, getState) => {
  dispatch(updateMassifAction());

  const requestOptions = {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: getState().login.authorizationHeader
  };

  return fetch(putMassifUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(res => {
      dispatch(updateMassifSuccess(res));
    })
    .catch(error =>
      dispatch(
        updateMassifFailure(
          makeErrorMessage(error.message, `Bad request`),
          error.message
        )
      )
    );
};
