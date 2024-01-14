import fetch from 'isomorphic-fetch';
import { associateDocumentToMassifUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const LINK_DOCUMENT_TO_MASSIF = 'LINK_DOCUMENT_TO_MASSIF';
export const LINK_DOCUMENT_TO_MASSIF_SUCCESS =
  'LINK_DOCUMENT_TO_MASSIF_SUCCESS';
export const LINK_DOCUMENT_TO_MASSIF_FAILURE =
  'LINK_DOCUMENT_TO_MASSIF_FAILURE';

export const linkDocumentToMassifAction = () => ({
  type: LINK_DOCUMENT_TO_MASSIF
});

export const linkDocumentToMassifSuccess = document => ({
  type: LINK_DOCUMENT_TO_MASSIF_SUCCESS,
  document
});

export const linkDocumentToMassifFailure = error => ({
  type: LINK_DOCUMENT_TO_MASSIF_FAILURE,
  error
});

export const linkDocumentToMassif =
  ({ massifId, document }) =>
  (dispatch, getState) => {
    dispatch(linkDocumentToMassifAction());

    const requestOptions = {
      method: 'PUT',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      associateDocumentToMassifUrl(massifId, document.id),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(() => dispatch(linkDocumentToMassifSuccess(document)))
      .catch(errorMessage => {
        dispatch(linkDocumentToMassifFailure(errorMessage));
      });
  };
