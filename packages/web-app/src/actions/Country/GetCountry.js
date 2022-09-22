import fetch from 'isomorphic-fetch';
import { getCountryUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAndGetStatus } from '../utils';

export const FETCH_COUNTRY = 'FETCH_COUNTRY';
export const FETCH_COUNTRY_SUCCESS = 'FETCH_COUNTRY_SUCCESS';
export const FETCH_COUNTRY_FAILURE = 'FETCH_COUNTRY_FAILURE';

export const fetchCountryAction = () => ({
  type: FETCH_COUNTRY
});

export const fetchCountryActionSuccess = country => ({
  type: FETCH_COUNTRY_SUCCESS,
  country
});

export const fetchCountryActionFailure = error => ({
  type: FETCH_COUNTRY_FAILURE,
  error
});

export function fetchCountry(countryId) {
  return dispatch => {
    dispatch(fetchCountryAction());

    const requestOptions = {
      method: 'GET'
    };

    return fetch(getCountryUrl(countryId), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        dispatch(fetchCountryActionSuccess(data));
      })
      .catch(error =>
        dispatch(
          fetchCountryActionFailure(
            makeErrorMessage(
              error.message,
              `Fetching country with id ${countryId}`
            ),
            error.message
          )
        )
      );
  };
}
