import fetch from 'isomorphic-fetch';
import { regionsSearchUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const REGIONS_SEARCH = 'REGIONS_SEARCH';
export const REGIONS_SEARCH_SUCCESS = 'REGIONS_SEARCH_SUCCESS';
export const REGIONS_SEARCH_FAILURE = 'REGIONS_SEARCH_FAILURE';
export const RESET_REGIONS_SEARCH = 'RESET_REGIONS_SEARCH';

export const searchRegions = () => ({
  type: REGIONS_SEARCH
});

export const searchRegionsSuccess = results => ({
  type: REGIONS_SEARCH_SUCCESS,
  results
});

export const searchRegionsFailure = error => ({
  type: REGIONS_SEARCH_FAILURE,
  error
});

export const resetRegionsSearch = () => ({
  type: RESET_REGIONS_SEARCH
});

export function loadRegionsSearch(query) {
  return dispatch => {
    dispatch(searchRegions());

    return fetch(regionsSearchUrl, {
      method: 'POST',
      body: JSON.stringify({ query })
    })
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(searchRegionsSuccess(data.results)))
      .catch(error =>
        dispatch(
          searchRegionsFailure(
            makeErrorMessage(error.message, `Fetching region ${query}`)
          )
        )
      );
  };
}
