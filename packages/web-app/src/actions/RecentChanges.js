import fetch from 'isomorphic-fetch';
import { getRecentChanges } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_RECENT_CHANGES = 'FETCH_RECENT_CHANGES';
export const FETCH_RECENT_CHANGES_SUCCESS = 'FETCH_RECENT_CHANGES_SUCCESS';
export const FETCH_RECENT_CHANGES_FAILURE = 'FETCH_RECENT_CHANGES_FAILURE';

export const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE';

export const fetchRecentChanges = () => ({
  type: FETCH_RECENT_CHANGES
});

export const fetchRecentChangesSuccess = changes => ({
  type: FETCH_RECENT_CHANGES_SUCCESS,
  changes
});

export const fetchRecentChangesFailure = error => ({
  type: FETCH_RECENT_CHANGES_FAILURE,
  error
});

export function loadRecentChanges() {
  return dispatch => {
    dispatch(fetchRecentChanges());

    return fetch(getRecentChanges)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(fetchRecentChangesSuccess(data.changes)))
      .catch(error =>
        dispatch(
          fetchRecentChangesFailure(
            makeErrorMessage(error.message, `Fetching recent changes`)
          )
        )
      );
  };
}
