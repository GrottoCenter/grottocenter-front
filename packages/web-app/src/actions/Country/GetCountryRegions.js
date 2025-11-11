import fetch from 'isomorphic-fetch';
import { regionsSearchUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';
import makeErrorMessage from '../../helpers/makeErrorMessage';

export const FETCH_COUNTRY_REGIONS = 'FETCH_COUNTRY_REGIONS';
export const FETCH_COUNTRY_REGIONS_SUCCESS = 'FETCH_COUNTRY_REGIONS_SUCCESS';
export const FETCH_COUNTRY_REGIONS_FAILURE = 'FETCH_COUNTRY_REGIONS_FAILURE';
export const SET_CACHED_COUNTRY_REGIONS = 'SET_CACHED_COUNTRY_REGIONS';

export const fetchCountryRegionsAction = () => ({
  type: FETCH_COUNTRY_REGIONS
});

export const fetchCountryRegionsSuccess = (
  regions,
  hasMore = false,
  totalCount = 0
) => ({
  type: FETCH_COUNTRY_REGIONS_SUCCESS,
  regions,
  hasMore,
  totalCount
});

export const fetchCountryRegionsFailure = error => ({
  type: FETCH_COUNTRY_REGIONS_FAILURE,
  error
});

export const setCachedCountryRegions = (regions, hasMore, totalCount) => ({
  type: SET_CACHED_COUNTRY_REGIONS,
  regions,
  hasMore,
  totalCount
});

export function fetchCountryRegions(countryId, offset = 0) {
  return dispatch => {
    dispatch(fetchCountryRegionsAction());

    return fetch(`${regionsSearchUrl}?query=${countryId}-&offset=${offset}`, {
      method: 'POST'
    })
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        const regions = (data.results || []).filter(
          item =>
            item.type === 'region' &&
            item.iso &&
            item.iso.startsWith(`${countryId}-`)
        );
        const hasMore = regions.length === 10;
        dispatch(
          fetchCountryRegionsSuccess(regions, hasMore, data.totalNbResults || 0)
        );
      })
      .catch(error =>
        dispatch(
          fetchCountryRegionsFailure(
            makeErrorMessage(
              error.message,
              `Fetching regions for country ${countryId}`
            )
          )
        )
      );
  };
}
