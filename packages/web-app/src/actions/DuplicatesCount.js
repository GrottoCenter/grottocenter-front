import fetch from 'isomorphic-fetch';
import { getDuplicatesEntranceUrl } from '../conf/apiRoutes';
import { checkAuthStatus, getTotalCount, makeUrl } from './utils';

export const FETCH_DUPLICATES_COUNT = 'FETCH_DUPLICATES_COUNT';
export const FETCH_DUPLICATES_COUNT_SUCCESS = 'FETCH_DUPLICATES_COUNT_SUCCESS';
export const FETCH_DUPLICATES_COUNT_FAILURE = 'FETCH_DUPLICATES_COUNT_FAILURE';

export function fetchDuplicatesCount() {
  return (dispatch, getState) => {
    dispatch({ type: FETCH_DUPLICATES_COUNT });

    return fetch(makeUrl(getDuplicatesEntranceUrl, { limit: 1, skip: 0 }), {
      headers: getState().login.authorizationHeader
    })
      .then(checkAuthStatus(dispatch))
      .then(response => {
        const contentRange = response.headers.get('Content-Range');
        const value = getTotalCount(0, contentRange);
        dispatch({
          type: FETCH_DUPLICATES_COUNT_SUCCESS,
          value
        });
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_DUPLICATES_COUNT_FAILURE, error });
      });
  };
}
