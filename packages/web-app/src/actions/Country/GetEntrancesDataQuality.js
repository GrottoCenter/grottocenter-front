import fetch from 'isomorphic-fetch';
import { getCountryEntrancesUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_SUCCESS =
  'FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_SUCCESS';
export const FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_LOADING =
  'FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_LOADING';
export const FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_ERROR =
  'FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_ERROR';

export const fetchCountryEntrances = countryId => (dispatch, getState) => {
  dispatch({ type: FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getCountryEntrancesUrl(countryId), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: FETCH_COUNTRY_ENTRANCES_DATA_QUALITY_ERROR,
        error: makeErrorMessage(
          error.message,
          `Fetching entrances of country id ${countryId}`
        )
      })
    );
};
