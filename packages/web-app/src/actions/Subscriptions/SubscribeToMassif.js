import fetch from 'isomorphic-fetch';
import { subscribeToMassifUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const SUBSCRIBE_TO_MASSIF = 'SUBSCRIBE_TO_MASSIF';
export const SUBSCRIBE_TO_MASSIF_SUCCESS = 'SUBSCRIBE_TO_MASSIF_SUCCESS';
export const SUBSCRIBE_TO_MASSIF_FAILURE = 'SUBSCRIBE_TO_MASSIF_FAILURE';

export const subscribeToMassifAction = () => ({
  type: SUBSCRIBE_TO_MASSIF
});

export const subscribeToMassifActionSuccess = () => ({
  type: SUBSCRIBE_TO_MASSIF_SUCCESS
});

export const subscribeToMassifActionFailure = error => ({
  type: SUBSCRIBE_TO_MASSIF_FAILURE,
  error
});

export function subscribeToMassif(massifId) {
  return (dispatch, getState) => {
    dispatch(subscribeToMassifAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(subscribeToMassifUrl(massifId), requestOptions).then(
      response => {
        if (response.status >= 400) {
          const error = `Subscribing you to massif with id ${massifId}`;
          dispatch(
            subscribeToMassifActionFailure(
              makeErrorMessage(response.status, error)
            )
          );
        } else {
          dispatch(subscribeToMassifActionSuccess());
        }
        return response;
      }
    );
  };
}
