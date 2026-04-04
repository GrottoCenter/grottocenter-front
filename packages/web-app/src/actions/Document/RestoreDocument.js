import fetch from 'isomorphic-fetch';
import { restoreDocumentUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const RESTORE_DOCUMENT = 'RESTORE_DOCUMENT';
export const RESTORE_DOCUMENT_SUCCESS = 'RESTORE_DOCUMENT_SUCCESS';
export const RESTORE_DOCUMENT_FAILURE = 'RESTORE_DOCUMENT_FAILURE';

const restoreDocumentAction = () => ({
  type: RESTORE_DOCUMENT
});

const restoreDocumentSuccess = data => ({
  type: RESTORE_DOCUMENT_SUCCESS,
  data
});

const restoreDocumentFailure = error => ({
  type: RESTORE_DOCUMENT_FAILURE,
  error
});

export const restoreDocument =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreDocumentAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreDocumentUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(restoreDocumentSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(restoreDocumentFailure(error));
      });
  };
