import fetch from 'isomorphic-fetch';
import { quicksearchUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

// A C T I O N S
export const RESET_QUICKSEARCH = 'RESET_QUICKSEARCH';
export const FETCH_QUICKSEARCH_SUCCESS = 'FETCH_QUICKSEARCH_SUCCESS';
export const FETCH_QUICKSEARCH_FAILURE = 'FETCH_QUICKSEARCH_FAILURE';
export const SET_CURRENT_ENTRY = 'SET_CURRENT_ENTRY';
export const FETCH_LOADING = 'FETCH_LOADING';

// A C T I O N S - C R E A T O R S
export const resetQuicksearch = () => ({
  type: RESET_QUICKSEARCH,
  results: undefined,
  error: undefined
});

export const fetchQuicksearchSuccess = results => ({
  type: FETCH_QUICKSEARCH_SUCCESS,
  results
});

export const fetchQuicksearchFailure = error => ({
  type: FETCH_QUICKSEARCH_FAILURE,
  error
});

export const setCurrentEntry = entry => ({
  type: SET_CURRENT_ENTRY,
  entry
});

export const fetchLoading = () => ({
  type: FETCH_LOADING
});

// THUNKS
export const fetchQuicksearchResult = criteria => dispatch => {
  dispatch(resetQuicksearch());
  dispatch(fetchLoading());

  return fetch(quicksearchUrl, {
    method: 'POST',
    body: JSON.stringify(criteria)
  })
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => {
      dispatch(fetchQuicksearchSuccess(JSON.parse(text).results));
    })
    .catch(error =>
      dispatch(
        fetchQuicksearchFailure(
          makeErrorMessage(error.message, `Fetching quicksearch`)
        )
      )
    );
};
