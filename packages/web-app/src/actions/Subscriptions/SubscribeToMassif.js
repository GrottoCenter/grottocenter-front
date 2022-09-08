import fetch from 'isomorphic-fetch';
import { subscribeToMassifUrl } from '../../conf/Config';

export const SUBSCRIBE_TO_MASSIF = 'SUBSCRIBE_TO_MASSIF';
export const SUBSCRIBE_TO_MASSIF_SUCCESS = 'SUBSCRIBE_TO_MASSIF_SUCCESS';
export const SUBSCRIBE_TO_MASSIF_FAILURE = 'SUBSCRIBE_TO_MASSIF_FAILURE';

export const subscribeToMassifAction = () => ({
  type: SUBSCRIBE_TO_MASSIF
});

export const subscribeToMassifActionSuccess = () => ({
  type: SUBSCRIBE_TO_MASSIF_SUCCESS
});

export const subscribeToMassifActionFailure = errorMessages => ({
  type: SUBSCRIBE_TO_MASSIF_FAILURE,
  errorMessages
});

export function subscribeToMassif(massifId) {
  return (dispatch, getState) => {
    dispatch(subscribeToMassifAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(subscribeToMassifUrl(massifId), requestOptions).then(
      response =>
        response.text().then(responseText => {
          if (response.status >= 400) {
            const errorMessages = [];
            switch (response.status) {
              case 404:
                errorMessages.push('Massif not found');
                break;
              case 500:
                errorMessages.push(
                  'A server error occurred, please try again later or contact Wikicaves for more information.'
                );
                break;
              default:
                break;
            }
            dispatch(
              subscribeToMassifActionFailure(errorMessages, response.status)
            );
            throw new Error(
              `Fetching ${subscribeToMassifUrl(massifId)} status: ${
                response.status
              }`,
              errorMessages
            );
          } else {
            dispatch(subscribeToMassifActionSuccess(response.status));
          }
          return response;
        })
    );
  };
}
