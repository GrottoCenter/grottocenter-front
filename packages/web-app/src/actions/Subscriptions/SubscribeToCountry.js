import fetch from 'isomorphic-fetch';
import { subscribeToCountryUrl } from '../../conf/Config';

export const SUBSCRIBE_TO_COUNTRY = 'SUBSCRIBE_TO_COUNTRY';
export const SUBSCRIBE_TO_COUNTRY_SUCCESS = 'SUBSCRIBE_TO_COUNTRY_SUCCESS';
export const SUBSCRIBE_TO_COUNTRY_FAILURE = 'SUBSCRIBE_TO_COUNTRY_FAILURE';

export const subscribeToCountryAction = () => ({
  type: SUBSCRIBE_TO_COUNTRY
});

export const subscribeToCountryActionSuccess = () => ({
  type: SUBSCRIBE_TO_COUNTRY_SUCCESS
});

export const subscribeToCountryActionFailure = errorMessages => ({
  type: SUBSCRIBE_TO_COUNTRY_FAILURE,
  errorMessages
});

export function subscribeToCountry(countryId) {
  return (dispatch, getState) => {
    dispatch(subscribeToCountryAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(subscribeToCountryUrl(countryId), requestOptions).then(
      response =>
        response.text().then(responseText => {
          if (response.status >= 400) {
            const errorMessages = [];
            switch (response.status) {
              case 404:
                errorMessages.push('Country not found');
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
              subscribeToCountryActionFailure(errorMessages, response.status)
            );
            throw new Error(
              `Fetching ${subscribeToCountryUrl(countryId)} status: ${
                response.status
              }`,
              errorMessages
            );
          } else {
            dispatch(subscribeToCountryActionSuccess(response.status));
          }
          return response;
        })
    );
  };
}
