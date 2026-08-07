import fetch from 'isomorphic-fetch';
import { getDocumentsUrl } from '../conf/apiRoutes';
import { checkAuthStatus, getTotalCount, makeUrl } from './utils';

export const FETCH_PENDING_DOCUMENTS_COUNT = 'FETCH_PENDING_DOCUMENTS_COUNT';
export const FETCH_PENDING_DOCUMENTS_COUNT_SUCCESS =
  'FETCH_PENDING_DOCUMENTS_COUNT_SUCCESS';
export const FETCH_PENDING_DOCUMENTS_COUNT_FAILURE =
  'FETCH_PENDING_DOCUMENTS_COUNT_FAILURE';

export function fetchPendingDocumentsCount() {
  return (dispatch, getState) => {
    dispatch({ type: FETCH_PENDING_DOCUMENTS_COUNT });

    return fetch(
      makeUrl(getDocumentsUrl, { isValidated: false, limit: 1, skip: 0 }),
      { headers: getState().login.authorizationHeader }
    )
      .then(checkAuthStatus(dispatch))
      .then(response => {
        const contentRange = response.headers.get('Content-Range');
        const value = getTotalCount(0, contentRange);
        dispatch({
          type: FETCH_PENDING_DOCUMENTS_COUNT_SUCCESS,
          value
        });
      })
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_PENDING_DOCUMENTS_COUNT_FAILURE, error });
      });
  };
}
