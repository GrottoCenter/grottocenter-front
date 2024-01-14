import fetch from 'isomorphic-fetch';
import { associateDocumentToMassifUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const UNLINK_DOCUMENT_TO_MASSIF = 'UNLINK_DOCUMENT_TO_MASSIF';
export const UNLINK_DOCUMENT_TO_MASSIF_SUCCESS =
  'UNLINK_DOCUMENT_TO_MASSIF_SUCCESS';
export const UNLINK_DOCUMENT_TO_MASSIF_FAILURE =
  'UNLINK_DOCUMENT_TO_MASSIF_FAILURE';

export const unlinkDocumentToMassifAction = () => ({
  type: UNLINK_DOCUMENT_TO_MASSIF
});

export const unlinkDocumentToMassifSuccess = documentId => ({
  type: UNLINK_DOCUMENT_TO_MASSIF_SUCCESS,
  documentId
});

export const unlinkDocumentToMassifFailure = error => ({
  type: UNLINK_DOCUMENT_TO_MASSIF_FAILURE,
  error
});

export const unlinkDocumentToMassif =
  ({ massifId, documentId }) =>
  (dispatch, getState) => {
    dispatch(unlinkDocumentToMassifAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      associateDocumentToMassifUrl(massifId, documentId),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(() => dispatch(unlinkDocumentToMassifSuccess(documentId)))
      .catch(errorMessage => {
        dispatch(unlinkDocumentToMassifFailure(errorMessage));
      });
  };
