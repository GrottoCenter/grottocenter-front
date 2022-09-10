import fetch from 'isomorphic-fetch';
import { subscribeToCountryUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const SUBSCRIBE_TO_COUNTRY = 'SUBSCRIBE_TO_COUNTRY';
export const SUBSCRIBE_TO_COUNTRY_SUCCESS = 'SUBSCRIBE_TO_COUNTRY_SUCCESS';
export const SUBSCRIBE_TO_COUNTRY_FAILURE = 'SUBSCRIBE_TO_COUNTRY_FAILURE';

export const subscribeToCountryAction = () => ({
  type: SUBSCRIBE_TO_COUNTRY
});

export const subscribeToCountryActionSuccess = () => ({
  type: SUBSCRIBE_TO_COUNTRY_SUCCESS
});

export const subscribeToCountryActionFailure = error => ({
  type: SUBSCRIBE_TO_COUNTRY_FAILURE,
  error
});

export function subscribeToCountry(countryId) {
  return (dispatch, getState) => {
    dispatch(subscribeToCountryAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(subscribeToCountryUrl(countryId), requestOptions).then(
      response => {
        if (response.status >= 400) {
          const error = `Subscribing you to country with id ${countryId}`;
          dispatch(
            subscribeToCountryActionFailure(
              makeErrorMessage(response.status, error)
            )
          );
        } else {
          dispatch(subscribeToCountryActionSuccess());
        }
        return response;
      }
    );
  };
}
