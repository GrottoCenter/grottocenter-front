import fetch from 'isomorphic-fetch';
import { findRandomEntranceUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_RANDOMENTRY = 'FETCH_RANDOMENTRY';
export const FETCH_RANDOMENTRY_SUCCESS = 'FETCH_RANDOMENTRY_SUCCESS';
export const FETCH_RANDOMENTRY_FAILURE = 'FETCH_RANDOMENTRY_FAILURE';

export const fetchRandomEntryNumber = () => ({
  type: FETCH_RANDOMENTRY,
  entry: undefined
});

export const fetchRandomEntrySuccess = entry => ({
  type: FETCH_RANDOMENTRY_SUCCESS,
  entry
});

export const fetchRandomEntryFailure = error => ({
  type: FETCH_RANDOMENTRY_FAILURE,
  error
});

export const loadRandomEntry = () => dispatch => {
  dispatch(fetchRandomEntryNumber());

  return fetch(findRandomEntranceUrl)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(fetchRandomEntrySuccess(JSON.parse(text))))
    .catch(error =>
      dispatch(
        fetchRandomEntryFailure(
          makeErrorMessage(error.message, `Fetching random entrance`)
        )
      )
    );
};
