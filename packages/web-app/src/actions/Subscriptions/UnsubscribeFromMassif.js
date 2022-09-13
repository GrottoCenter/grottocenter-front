import fetch from 'isomorphic-fetch';
import { unsubscribeFromMassifUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UNSUBSCRIBE_FROM_MASSIF = 'UNSUBSCRIBE_FROM_MASSIF';
export const UNSUBSCRIBE_FROM_MASSIF_SUCCESS =
  'UNSUBSCRIBE_FROM_MASSIF_SUCCESS';
export const UNSUBSCRIBE_FROM_MASSIF_FAILURE =
  'UNSUBSCRIBE_FROM_MASSIF_FAILURE';

export const unsubscribeFromMassifAction = () => ({
  type: UNSUBSCRIBE_FROM_MASSIF
});

export const unsubscribeFromMassifActionSuccess = massifId => ({
  type: UNSUBSCRIBE_FROM_MASSIF_SUCCESS,
  massifId
});

export const unsubscribeFromMassifActionFailure = error => ({
  type: UNSUBSCRIBE_FROM_MASSIF_FAILURE,
  error
});

export function unsubscribeFromMassif(massifId) {
  return (dispatch, getState) => {
    dispatch(unsubscribeFromMassifAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(unsubscribeFromMassifUrl(massifId), requestOptions).then(
      response => {
        if (response.status >= 400) {
          let error = '';
          switch (response.status) {
            case 404:
              error = 'Massif not found';
              break;
            case 500:
              error = `Unsubscribing you from massif with id ${massifId}`;
              break;
            default:
              break;
          }
          dispatch(
            unsubscribeFromMassifActionFailure(
              makeErrorMessage(response.status, error)
            )
          );
        } else {
          dispatch(unsubscribeFromMassifActionSuccess(massifId));
        }
        return response;
      }
    );
  };
}
