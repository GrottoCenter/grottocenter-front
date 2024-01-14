import fetch from 'isomorphic-fetch';
import { associateDocumentToEntranceUrl } from '../conf/apiRoutes';
import { checkAndGetStatus } from './utils';

export const LINK_DOCUMENT_TO_ENTRANCE = 'LINK_DOCUMENT_TO_ENTRANCE';
export const LINK_DOCUMENT_TO_ENTRANCE_SUCCESS =
  'LINK_DOCUMENT_TO_ENTRANCE_SUCCESS';
export const LINK_DOCUMENT_TO_ENTRANCE_FAILURE =
  'LINK_DOCUMENT_TO_ENTRANCE_FAILURE';

export const linkDocumentToEntranceAction = () => ({
  type: LINK_DOCUMENT_TO_ENTRANCE
});

export const linkDocumentToEntranceSuccess = document => ({
  type: LINK_DOCUMENT_TO_ENTRANCE_SUCCESS,
  document
});

export const linkDocumentToEntranceFailure = error => ({
  type: LINK_DOCUMENT_TO_ENTRANCE_FAILURE,
  error
});

export const linkDocumentToEntrance =
  ({ entranceId, document }) =>
  (dispatch, getState) => {
    dispatch(linkDocumentToEntranceAction());

    const requestOptions = {
      method: 'PUT',
      headers: getState().login.authorizationHeader
    };

    return fetch(
      associateDocumentToEntranceUrl(entranceId, document.id),
      requestOptions
    )
      .then(checkAndGetStatus)
      .then(() => dispatch(linkDocumentToEntranceSuccess(document)))
      .catch(errorMessage => {
        dispatch(linkDocumentToEntranceFailure(errorMessage));
      });
  };
