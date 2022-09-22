import fetch from 'isomorphic-fetch';
import { unsubscribeFromMassifUrl } from '../../conf/apiRoutes';
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
          const error = `Unsubscribing you from massif with id ${massifId}`;
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
