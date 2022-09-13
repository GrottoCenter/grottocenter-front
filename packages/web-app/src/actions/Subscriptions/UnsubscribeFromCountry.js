import fetch from 'isomorphic-fetch';
import { unsubscribeFromCountryUrl } from '../../conf/Config';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const UNSUBSCRIBE_FROM_COUNTRY = 'UNSUBSCRIBE_FROM_COUNTRY';
export const UNSUBSCRIBE_FROM_COUNTRY_SUCCESS =
  'UNSUBSCRIBE_FROM_COUNTRY_SUCCESS';
export const UNSUBSCRIBE_FROM_COUNTRY_FAILURE =
  'UNSUBSCRIBE_FROM_COUNTRY_FAILURE';

export const unsubscribeFromCountryAction = () => ({
  type: UNSUBSCRIBE_FROM_COUNTRY
});

export const unsubscribeFromCountryActionSuccess = countryId => ({
  type: UNSUBSCRIBE_FROM_COUNTRY_SUCCESS,
  countryId
});

export const unsubscribeFromCountryActionFailure = error => ({
  type: UNSUBSCRIBE_FROM_COUNTRY_FAILURE,
  error
});

export function unsubscribeFromCountry(countryId) {
  return (dispatch, getState) => {
    dispatch(unsubscribeFromCountryAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(unsubscribeFromCountryUrl(countryId), requestOptions).then(
      response => {
        if (response.status >= 400) {
          let error = '';
          switch (response.status) {
            case 404:
              error = 'Country not found';
              break;
            case 500:
              error = `Unsubscribing you from country with id ${countryId}`;
              break;
            default:
              break;
          }
          dispatch(
            unsubscribeFromCountryActionFailure(
              makeErrorMessage(response.status, error)
            )
          );
        } else {
          dispatch(unsubscribeFromCountryActionSuccess(countryId));
        }
        return response;
      }
    );
  };
}
