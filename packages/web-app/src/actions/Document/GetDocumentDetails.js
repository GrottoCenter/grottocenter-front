import fetch from 'isomorphic-fetch';
import { getDocumentDetailsUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_DOCUMENT_DETAILS = 'FETCH_DOCUMENT_DETAILS';
export const FETCH_DOCUMENT_DETAILS_SUCCESS = 'FETCH_DOCUMENT_DETAILS_SUCCESS';
export const FETCH_DOCUMENT_DETAILS_FAILURE = 'FETCH_DOCUMENT_DETAILS_FAILURE';

export const fetchDocumentDetails =
  (documentId, requireUpdate) => (dispatch, getState) => {
    dispatch({ type: FETCH_DOCUMENT_DETAILS });

    const requestOptions = {
      headers: getState().login.authorizationHeader
    };

    const updateParam = requireUpdate ? `?requireUpdate=${requireUpdate}` : '';
    return fetch(
      getDocumentDetailsUrl + documentId + updateParam,
      requestOptions
    )
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch({ type: FETCH_DOCUMENT_DETAILS_SUCCESS, data }))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch({ type: FETCH_DOCUMENT_DETAILS_FAILURE, error });
      });
  };
