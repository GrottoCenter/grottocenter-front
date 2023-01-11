import fetch from 'isomorphic-fetch';
import { getStatisticsCountryUrl } from '../../conf/apiRoutes';

export const FETCH_STATISTICS_COUNTRY_SUCCESS =
  'FETCH_STATISTICS_COUNTRY_SUCCESS';
export const FETCH_STATISTICS_COUNTRY_LOADING =
  'FETCH_STATISTICS_COUNTRY_LOADING';
export const FETCH_STATISTICS_COUNTRY_ERROR = 'FETCH_STATISTICS_COUNTRY_ERROR';

export const fetchStatisticsCountry = countryId => (dispatch, getState) => {
  dispatch({ type: FETCH_STATISTICS_COUNTRY_LOADING });
  const requestOptions = {
    headers: {
      ...getState().login.authorizationHeader
    }
  };
  return fetch(getStatisticsCountryUrl(countryId), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(data => {
      dispatch({ type: FETCH_STATISTICS_COUNTRY_SUCCESS, data });
    })
    .catch(error =>
      dispatch({
        type: FETCH_STATISTICS_COUNTRY_ERROR,
        error
      })
    );
};
