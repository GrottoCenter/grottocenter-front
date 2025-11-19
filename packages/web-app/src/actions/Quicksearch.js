import fetch from 'isomorphic-fetch';
import { quickSearchUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const RESET_QUICKSEARCH = 'RESET_QUICKSEARCH';
export const FETCH_QUICKSEARCH_SUCCESS = 'FETCH_QUICKSEARCH_SUCCESS';
export const FETCH_QUICKSEARCH_FAILURE = 'FETCH_QUICKSEARCH_FAILURE';
export const FETCH_LOADING = 'FETCH_LOADING';

export const resetQuicksearch = () => ({ type: RESET_QUICKSEARCH });

const fetchQuicksearchSuccess = results => ({
  type: FETCH_QUICKSEARCH_SUCCESS,
  results
});

const fetchQuicksearchFailure = error => ({
  type: FETCH_QUICKSEARCH_FAILURE,
  error
});

export const fetchQuickSearchRaw = ({ query, entities, filter }) => {
  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ query, entities, filter })
  };

  return fetch(quickSearchUrl, requestOptions)
    .then(checkAndGetStatus)
    .then(response => response.json());
};

export const fetchQuicksearchResult =
  ({ query, entities, filter }) =>
  dispatch => {
    dispatch(resetQuicksearch());
    dispatch({ type: FETCH_LOADING });

    return fetchQuickSearchRaw({ query, entities, filter })
      .then(d => dispatch(fetchQuicksearchSuccess(d.results)))
      .catch(errorMessage => {
        dispatch(fetchQuicksearchFailure(errorMessage));
      });
  };
