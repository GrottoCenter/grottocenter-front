import fetch from 'isomorphic-fetch';
import { associateDocumentToEntranceUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const UNLINK_DOCUMENT_TO_ENTRANCE = 'UNLINK_DOCUMENT_TO_ENTRANCE';
export const UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS =
  'UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS';
export const UNLINK_DOCUMENT_TO_ENTRANCE_FAILURE =
  'UNLINK_DOCUMENT_TO_ENTRANCE_FAILURE';

export const unlinkDocumentToEntranceAction = () => ({
  type: UNLINK_DOCUMENT_TO_ENTRANCE
});

export const unlinkDocumentToEntranceSuccess = documentId => ({
  type: UNLINK_DOCUMENT_TO_ENTRANCE_SUCCESS,
  documentId
});

export const unlinkDocumentToEntranceFailure = error => ({
  type: UNLINK_DOCUMENT_TO_ENTRANCE_FAILURE,
  error
});

export const unlinkDocumentToEntrance =
  ({ entranceId, documentId }) =>
  (dispatch, getState) => {
    dispatch(unlinkDocumentToEntranceAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      associateDocumentToEntranceUrl(entranceId, documentId),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(() => dispatch(unlinkDocumentToEntranceSuccess(documentId)))
      .catch(errorMessage => {
        dispatch(unlinkDocumentToEntranceFailure(errorMessage));
      });
  };
